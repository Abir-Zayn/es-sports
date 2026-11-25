-- Existing teams in friendlies and tournaments, one competition at a time, and the team owner's consent before a
-- finished competition counts on the team's record ("sync"). A sync request lives 48 hours; unanswered, it expires
-- and its notification goes, while the match data stays as it is. Functions that already existed were read from the
-- live database first; only the marked parts change.

-- 1. A friendly side can be an existing team.
alter table public.matches add column if not exists team_a_id uuid references public.teams (id) on delete set null;
alter table public.matches add column if not exists team_b_id uuid references public.teams (id) on delete set null;
create index if not exists matches_team_a_idx on public.matches (team_a_id) where team_a_id is not null;
create index if not exists matches_team_b_idx on public.matches (team_b_id) where team_b_id is not null;

-- 2. Why a team cannot join another competition now, or null. Busy: in a tournament not yet closed, or a friendly not
--    yet completed. `p_tournament` is the tournament it is joining, which does not count against it.
create or replace function public.team_busy_reason(p_team uuid, p_tournament uuid default null)
returns text
language sql
stable
security definer
set search_path to ''
as $function$
  select case
    when exists (select 1 from public.teams where id = p_team and registered_at is null)
      then 'This team is still a draft. It needs 4 players and to be registered first.'
    when exists (select 1 from public.tournament_teams tt join public.tournaments t on t.id = tt.tournament_id
                  where tt.team_id = p_team and t.closed_at is null and t.deleted_at is null and t.id is distinct from p_tournament)
      then 'This team is playing in a tournament that has not finished.'
    when exists (select 1 from public.matches m where p_team in (m.team_a_id, m.team_b_id)
                  and m.tournament_id is null and m.status <> 'completed')
      then 'This team is in a friendly match that has not finished.'
  end
$function$;
grant execute on function public.team_busy_reason(uuid, uuid) to authenticated;

-- An existing team entering a tournament must be free. (Changed: the busy check; otherwise the live definition.)
create or replace function public.link_tournament_team(p_tournament uuid, p_team uuid, p_team_role text)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_busy text;
begin
  if exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    return;
  end if;
  if p_team_role is null or p_team_role not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can enter this team' using errcode = '42501';
  end if;
  v_busy := public.team_busy_reason(p_team, p_tournament);
  if v_busy is not null then raise exception '%', v_busy using errcode = 'ET023'; end if;
  if (select count(*) from public.tournament_teams where tournament_id = p_tournament)
    >= (select teams_planned from public.tournaments where id = p_tournament) then
    raise exception 'This tournament is full' using errcode = 'ET001';
  end if;
  insert into public.tournament_teams (tournament_id, team_id, added_by) values (p_tournament, p_team, (select auth.uid()));
end;
$function$;

-- 3. Sync requests: one per team per tournament or friendly.
create table if not exists public.team_syncs (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  tournament_id uuid references public.tournaments (id) on delete cascade,
  match_id uuid references public.matches (id) on delete cascade,
  requested_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '48 hours',
  resolved_at timestamptz,
  check (num_nonnulls(tournament_id, match_id) = 1),
  check ((status = 'pending') = (resolved_at is null))
);
create unique index if not exists team_syncs_tournament_uq on public.team_syncs (team_id, tournament_id) where tournament_id is not null;
create unique index if not exists team_syncs_match_uq on public.team_syncs (team_id, match_id) where match_id is not null;
create index if not exists team_syncs_pending_idx on public.team_syncs (expires_at) where status = 'pending';
alter table public.team_syncs enable row level security;
-- A team's record is public, so everyone signed in may read which competitions were synced. Writes go through the
-- functions below.
drop policy if exists "team_syncs: signed-in users can read" on public.team_syncs;
create policy "team_syncs: signed-in users can read" on public.team_syncs for select to authenticated using (true);
grant select on public.team_syncs to authenticated;

alter table public.notifications drop constraint if exists notifications_kind_check;
alter table public.notifications add constraint notifications_kind_check
  check (kind = any (array['invite'::text, 'invite_response'::text, 'system'::text, 'team_sync'::text]));

-- Who answers for a team: its owner member, or for a team made inside a tournament (players only, no owner
-- member) the account that created it, which the app already treats as its owner.
create or replace function public.team_owner_id(p_team uuid)
returns uuid
language sql
stable
security definer
set search_path to ''
as $function$
  select coalesce(
    (select m.profile_id from public.team_members m where m.team_id = p_team and m.role = 'owner' limit 1),
    (select t.created_by from public.teams t where t.id = p_team))
$function$;

-- Asks each team's owner to add a finished competition to the team's record. A repeat asks only teams with no
-- request open or accepted; a declined or expired one is asked again. Returns how many owners were asked.
create or replace function public.request_team_sync(p_tournament uuid default null, p_match uuid default null)
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare v_uid uuid := (select auth.uid()); v_label text; v_count int := 0; v_team uuid; v_sync uuid;
begin
  if v_uid is null then raise exception 'Sign in to sync team records' using errcode = '42501'; end if;
  if num_nonnulls(p_tournament, p_match) <> 1 then raise exception 'Choose a tournament or a friendly match' using errcode = '22023'; end if;
  if p_tournament is not null then
    if not exists (select 1 from public.tournament_staff where tournament_id = p_tournament and user_id = v_uid and role = 'owner') then
      raise exception 'Only the tournament owner can sync team records' using errcode = '42501';
    end if;
    select name into v_label from public.tournaments where id = p_tournament and closed_at is not null;
    if not found then raise exception 'Close the tournament before syncing team records' using errcode = 'ET024'; end if;
  else
    select title into v_label from public.matches where id = p_match and created_by = v_uid and tournament_id is null and status = 'completed';
    if not found then raise exception 'Only the person who set up a finished friendly can sync it' using errcode = 'ET024'; end if;
    v_label := coalesce(v_label, 'a friendly match');
  end if;
  for v_team in
    select tt.team_id from public.tournament_teams tt where p_tournament is not null and tt.tournament_id = p_tournament
    union
    select unnest(array[m.team_a_id, m.team_b_id]) from public.matches m where p_match is not null and m.id = p_match
  loop
    continue when v_team is null;
    if exists (select 1 from public.team_syncs where team_id = v_team and status in ('pending', 'accepted')
               and (tournament_id = p_tournament or match_id = p_match)) then
      continue;
    end if;
    delete from public.team_syncs where team_id = v_team and (tournament_id = p_tournament or match_id = p_match);
    insert into public.team_syncs (team_id, tournament_id, match_id, requested_by)
    values (v_team, p_tournament, p_match, v_uid) returning id into v_sync;
    insert into public.notifications (user_id, kind, title, message, data)
    select public.team_owner_id(v_team), 'team_sync', 'Add results to your team',
      format('Add %s to %s''s match record? This request ends in 48 hours.', v_label, t.name),
      jsonb_build_object('sync_id', v_sync, 'team_id', v_team, 'tournament_id', p_tournament, 'match_id', p_match, 'status', 'pending')
      from public.teams t where t.id = v_team and public.team_owner_id(v_team) is not null;
    v_count := v_count + 1;
  end loop;
  return v_count;
end $function$;

-- The team owner's answer. Accepting adds the competition to the team's record; either answer tells the requester.
create or replace function public.respond_team_sync(p_sync uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path to ''
as $function$
declare v_uid uuid := (select auth.uid()); s public.team_syncs; v_status text := case when p_accept then 'accepted' else 'declined' end;
begin
  select * into s from public.team_syncs where id = p_sync for update;
  if not found then raise exception 'This sync request could not be found' using errcode = 'P0002'; end if;
  if public.team_owner_id(s.team_id) is distinct from v_uid then
    raise exception 'Only the team owner can answer this request' using errcode = '42501';
  end if;
  if s.status = v_status then return; end if;
  if s.status <> 'pending' or s.expires_at <= now() then
    raise exception 'This sync request has expired or was already answered' using errcode = 'ET025';
  end if;
  update public.team_syncs set status = v_status, resolved_at = now() where id = p_sync;
  update public.notifications set read_at = coalesce(read_at, now()), data = jsonb_set(data, '{status}', to_jsonb(v_status))
   where kind = 'team_sync' and data ->> 'sync_id' = p_sync::text;
  insert into public.notifications (user_id, kind, title, message, data)
  select s.requested_by, 'system', case when p_accept then 'Team record updated' else 'Sync declined' end,
    format('%s %s the results.', t.name, case when p_accept then 'added' else 'did not add' end),
    jsonb_build_object('sync_id', p_sync, 'team_id', s.team_id, 'status', v_status)
    from public.teams t where t.id = s.team_id;
end $function$;

revoke all on function public.request_team_sync(uuid, uuid), public.respond_team_sync(uuid, boolean) from public, anon;
grant execute on function public.request_team_sync(uuid, uuid), public.respond_team_sync(uuid, boolean) to authenticated;

-- 4. Unanswered requests expire after 48 hours; their notifications go, the request stays as expired.
create or replace function public.expire_team_syncs()
returns integer
language plpgsql
security definer
set search_path to ''
as $function$
declare v_count int;
begin
  with gone as (
    update public.team_syncs set status = 'expired', resolved_at = now()
     where status = 'pending' and expires_at <= now() returning id
  ), cleared as (
    delete from public.notifications n using gone where n.kind = 'team_sync' and n.data ->> 'sync_id' = gone.id::text returning 1
  )
  select count(*) into v_count from gone;
  return v_count;
end $function$;
revoke all on function public.expire_team_syncs() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'expire-team-syncs';
select cron.schedule('expire-team-syncs', '*/15 * * * *', 'select public.expire_team_syncs()');

-- 5. A friendly side can be an existing team the creator owns or runs, registered and free. (Changed: the team_a_id /
--    team_b_id keys and their checks; otherwise the live definition.)
create or replace function public.create_friendly_match(p_match jsonb, p_players jsonb, p_scorer uuid default null::uuid)
returns uuid
language plpgsql
set search_path to ''
as $function$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_row public.matches;
  v_existing public.matches;
  v_player jsonb;
  v_team uuid;
  v_busy text;
begin
  if v_uid is null then
    raise exception 'Sign in to create a friendly match' using errcode = '42501';
  end if;
  if p_match is null or jsonb_typeof(p_match) <> 'object' then
    raise exception 'Match details must be a JSON object' using errcode = '22023';
  end if;
  if coalesce(p_match ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Match id must be a uuid' using errcode = '22023';
  end if;
  v_id := (p_match ->> 'id')::uuid;

  -- One call per match id at a time. Released when the transaction ends.
  perform pg_advisory_xact_lock(hashtextextended('create_friendly_match:' || v_id::text, 0));

  select * into v_existing from public.matches where id = v_id;
  if found then
    if v_existing.created_by is distinct from v_uid then
      raise exception 'This match id belongs to another account' using errcode = '42501';
    end if;
    if coalesce(v_existing.fixture_ref, '') not like 'friendly-%' then
      raise exception 'This match id belongs to a match that is not a friendly' using errcode = '22023';
    end if;
    -- Already complete: a repeat call or a retry after a lost reply. The payload is not looked at.
    if exists (select 1 from public.match_players where match_id = v_id) then
      return v_id;
    end if;
    -- A partial match from the old three-request flow can be completed only before scoring starts.
    if v_existing.status <> 'scheduled' then
      raise exception 'This match has no squads and has already started' using errcode = '55000';
    end if;
  end if;

  -- From here on the match is new or partial, so the payload must be valid.
  if v_existing.id is null and coalesce(p_match ->> 'fixture_ref', '') not like 'friendly-%' then
    raise exception 'A friendly match needs a fixture_ref that starts with friendly-' using errcode = '22023';
  end if;
  if p_players is null or jsonb_typeof(p_players) <> 'array' or jsonb_array_length(p_players) = 0 then
    raise exception 'A friendly match needs at least one player' using errcode = '22023';
  end if;
  for v_player in select value from jsonb_array_elements(p_players) loop
    if jsonb_typeof(v_player) <> 'object'
      or coalesce(v_player ->> 'key', '') = ''
      or coalesce(v_player ->> 'name', '') = ''
      or coalesce(v_player ->> 'side', '') not in ('a', 'b')
      or jsonb_typeof(v_player -> 'sort_order') is distinct from 'number' then
      raise exception 'Each player needs key, side (a or b), name and sort_order' using errcode = '22023';
    end if;
  end loop;
  -- The scorer is nobody, the creator, or an account in the squads.
  if p_scorer is not null and p_scorer <> v_uid and not exists (
    select 1 from jsonb_array_elements(p_players) p where lower(p.value ->> 'profile_id') = p_scorer::text
  ) then
    raise exception 'The scorer must be the creator or a player in the squads' using errcode = '22023';
  end if;
  -- New: an existing team on either side must be one the creator runs, registered, and not busy elsewhere.
  if v_existing.id is null then
    if nullif(p_match ->> 'team_a_id', '') is not null and nullif(p_match ->> 'team_a_id', '') = nullif(p_match ->> 'team_b_id', '') then
      raise exception 'A team cannot play itself' using errcode = '22023';
    end if;
    for v_team in select nullif(p_match ->> k, '')::uuid from unnest(array['team_a_id', 'team_b_id']) k loop
      continue when v_team is null;
      -- Read directly: this function runs as the caller, who may not call team_member_role (and it raises for non-members).
      if not exists (select 1 from public.team_members where team_id = v_team and profile_id = v_uid and role in ('owner', 'admin')) then
        raise exception 'Only the team owner or an admin can bring this team to a friendly' using errcode = '42501';
      end if;
      v_busy := public.team_busy_reason(v_team);
      if v_busy is not null then raise exception '%', v_busy using errcode = 'ET023'; end if;
    end loop;
  end if;

  if v_existing.id is null then
    -- Only the setup columns are read. Any other key, valid or not, is ignored.
    v_row := jsonb_populate_record(null::public.matches, (
      select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(p_match) e
      where e.key in ('fixture_ref', 'title', 'team_a_name', 'team_a_short', 'team_a_tone', 'team_a_image_url',
        'team_b_name', 'team_b_short', 'team_b_tone', 'team_b_image_url', 'overs_limit', 'toss_winner_side',
        'toss_decision', 'record_shots', 'team_a_id', 'team_b_id')
    ));
    insert into public.matches (
      id, fixture_ref, created_by, title,
      team_a_name, team_a_short, team_a_tone, team_a_image_url,
      team_b_name, team_b_short, team_b_tone, team_b_image_url,
      overs_limit, status, toss_winner_side, toss_decision, record_shots, started_at, team_a_id, team_b_id
    ) values (
      v_id, v_row.fixture_ref, v_uid, v_row.title,
      v_row.team_a_name, v_row.team_a_short, v_row.team_a_tone, v_row.team_a_image_url,
      v_row.team_b_name, v_row.team_b_short, v_row.team_b_tone, v_row.team_b_image_url,
      coalesce(v_row.overs_limit, 20), 'scheduled', v_row.toss_winner_side, v_row.toss_decision,
      coalesce(v_row.record_shots, true), null, v_row.team_a_id, v_row.team_b_id
    )
    on conflict (id) do nothing;
    -- A writer that skips this function (an older app build) took the id between the check and the insert.
    -- Retrying the call then takes the existing-match path above.
    if not found then
      raise exception 'This match was saved at the same time by another request; try again' using errcode = '40001';
    end if;
  end if;

  insert into public.match_players (match_id, key, side, name, role, in_playing_xi, sort_order, profile_id)
  select v_id, p.value ->> 'key', p.value ->> 'side', p.value ->> 'name', p.value ->> 'role',
    coalesce((p.value ->> 'in_playing_xi')::boolean, false), (p.value ->> 'sort_order')::smallint,
    nullif(p.value ->> 'profile_id', '')::uuid
  from jsonb_array_elements(p_players) p;

  if p_scorer is not null then
    insert into public.match_scorers (match_id, user_id) values (v_id, p_scorer)
    on conflict (match_id, user_id) do nothing;
  end if;

  return v_id;
end;
$function$;
