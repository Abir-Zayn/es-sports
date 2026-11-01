-- Tournaments, their staff and the teams entered (roadmap steps 14 and 15-lite).
--
-- * `tournaments` holds the setup chosen in the create screen (the rules of `validateDraft` in
--   src/features/tournament/create/draft.ts are repeated as table checks). `owner_id` is the creator and never
--   changes; the `owner` row in `tournament_staff` is the authority for permissions.
-- * `tournament_staff`: exactly one `owner` and any number of `moderator`. Moderators join through invitations
--   (step 13, migration 20261102020000).
-- * `tournament_teams` links teams to a tournament, at most `teams_planned` of them.
-- * Any signed-in user reads all three tables. Rows are written only by the functions below (security definer,
--   search_path pinned, sign-in check first, the tournament row locked before reading staff or seats, then the
--   team row). Direct writes are revoked.
-- * `create_team` (20261102000000) is redefined here to share `insert_team` with `create_tournament_team`;
--   its signature, defaults, grants and behaviour are unchanged.
-- * Error codes: 42501 not signed in or not allowed, 22023 invalid input, P0002 not found, 23505 id used by
--   another account, ET001 tournament full
--   (the contract's ET01 is not a valid SQLSTATE: Postgres needs exactly five characters).

create table public.tournaments (
  id uuid primary key,
  owner_id uuid references public.profiles (id) on delete set null,
  name text not null check (name = btrim(name) and char_length(name) between 3 and 80),
  city text not null check (city = btrim(city) and char_length(city) between 2 and 60),
  venue text not null check (venue = btrim(venue) and char_length(venue) between 2 and 80),
  start_date date not null,
  end_date date not null check (end_date >= start_date),
  match_format text not null check (match_format in ('T10', 'T20', 'ODI')),
  competition text not null check (competition in ('league-knockout', 'league', 'knockout')),
  teams_planned int not null check (teams_planned in (4, 6, 8, 12, 16)),
  ball text not null check (ball in ('Tennis', 'Leather')),
  side_format text not null check (side_format in ('gully_6', 'tapeball_8', 'local_10', 'standard_11', 'custom')),
  players_per_side int not null check (players_per_side between 6 and 11),
  min_squad int not null,
  max_squad int not null check (max_squad <= 16),
  registration_opens date,
  registration_deadline date,
  cover_url text check (cover_url ~ '^https://'),
  profile_url text check (profile_url ~ '^https://'),
  created_at timestamptz not null default now(),
  check (competition <> 'knockout' or teams_planned in (4, 8, 16)),
  check (min_squad >= players_per_side and max_squad >= min_squad),
  check (registration_deadline is null
    or (registration_deadline <= start_date and registration_deadline >= coalesce(registration_opens, registration_deadline)))
);

create table public.tournament_staff (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'moderator')),
  added_at timestamptz not null default now(),
  primary key (tournament_id, user_id)
);

create table public.tournament_teams (
  tournament_id uuid not null references public.tournaments (id) on delete cascade,
  team_id uuid not null references public.teams (id) on delete cascade,
  added_by uuid references public.profiles (id) on delete set null,
  added_at timestamptz not null default now(),
  primary key (tournament_id, team_id)
);

create unique index tournament_staff_one_owner on public.tournament_staff (tournament_id) where role = 'owner';
create index tournament_staff_user_idx on public.tournament_staff (user_id);
create index tournament_teams_team_idx on public.tournament_teams (team_id);
create index tournaments_owner_idx on public.tournaments (owner_id);

-- Team creation shared by create_team and create_tournament_team. The caller has already checked sign-in.
-- Idempotent on the id: a repeat by the same owner returns it unchanged; another account's id is 23505.
create function public.insert_team(
  p_owner uuid, p_id uuid, p_name text, p_short_name text, p_tone text default 'neutral',
  p_logo_url text default null, p_area text default null, p_district text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_creator uuid;
begin
  if p_id is null then
    raise exception 'Team id is required' using errcode = '22023';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('create_team:' || p_id::text, 0));
  select created_by into v_creator from public.teams where id = p_id;
  if found then
    if v_creator is distinct from p_owner then
      raise exception 'This team id is already used' using errcode = '23505';
    end if;
    return p_id;
  end if;
  insert into public.teams (id, name, short_name, tone, logo_url, area, district, created_by)
  values (p_id, btrim(p_name), upper(btrim(p_short_name)), coalesce(p_tone, 'neutral'), nullif(btrim(p_logo_url), ''),
    nullif(btrim(p_area), ''), nullif(btrim(p_district), ''), p_owner);
  insert into public.team_members (team_id, profile_id, role) values (p_id, p_owner, 'owner');
  return p_id;
exception when check_violation or not_null_violation then
  raise exception 'Team details are not valid: %', sqlerrm using errcode = '22023';
end;
$$;
revoke all on function public.insert_team(uuid, uuid, text, text, text, text, text, text) from public, anon, authenticated;

create or replace function public.create_team(
  p_id uuid, p_name text, p_short_name text, p_tone text default 'neutral',
  p_logo_url text default null, p_area text default null, p_district text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to create a team' using errcode = '42501';
  end if;
  return public.insert_team((select auth.uid()), p_id, p_name, p_short_name, p_tone, p_logo_url, p_area, p_district);
end;
$$;

-- Sign-in check and the per-tournament lock shared by every tournament change. Returns the caller's staff role.
create function public.begin_tournament_change(p_tournament uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in to change this tournament' using errcode = '42501';
  end if;
  perform 1 from public.tournaments where id = p_tournament for update;
  if not found then
    raise exception 'This tournament could not be found' using errcode = 'P0002';
  end if;
  select role into v_role from public.tournament_staff where tournament_id = p_tournament and user_id = (select auth.uid());
  return v_role;
end;
$$;
revoke all on function public.begin_tournament_change(uuid) from public, anon, authenticated;

-- Links a team. A repeat returns at once; otherwise the caller must own or administer the team, and a seat
-- must be free. The tournament and team rows are already locked by the caller.
create function public.link_tournament_team(p_tournament uuid, p_team uuid, p_team_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if exists (select 1 from public.tournament_teams where tournament_id = p_tournament and team_id = p_team) then
    return;
  end if;
  if p_team_role is null or p_team_role not in ('owner', 'admin') then
    raise exception 'Only the team owner or an admin can enter this team' using errcode = '42501';
  end if;
  if (select count(*) from public.tournament_teams where tournament_id = p_tournament)
    >= (select teams_planned from public.tournaments where id = p_tournament) then
    raise exception 'This tournament is full' using errcode = 'ET001';
  end if;
  insert into public.tournament_teams (tournament_id, team_id, added_by) values (p_tournament, p_team, (select auth.uid()));
end;
$$;
revoke all on function public.link_tournament_team(uuid, uuid, text) from public, anon, authenticated;

-- Creates a tournament with the caller as owner. Idempotent on p.id. Keys are the column names; any other key
-- (owner, images, created_at) is ignored, and an empty string counts as null.
create function public.create_tournament(p jsonb) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_owner uuid;
  t public.tournaments;
begin
  if v_uid is null then
    raise exception 'Sign in to create a tournament' using errcode = '42501';
  end if;
  if p is null or jsonb_typeof(p) <> 'object'
    or coalesce(p ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Tournament id must be a uuid' using errcode = '22023';
  end if;
  v_id := (p ->> 'id')::uuid;
  perform pg_advisory_xact_lock(hashtextextended('create_tournament:' || v_id::text, 0));
  select owner_id into v_owner from public.tournaments where id = v_id;
  if found then
    if v_owner is distinct from v_uid then
      raise exception 'This tournament id is already used' using errcode = '23505';
    end if;
    return v_id;
  end if;
  t := jsonb_populate_record(null::public.tournaments, (
    select coalesce(jsonb_object_agg(e.key, case when e.value = '""'::jsonb then 'null'::jsonb else e.value end), '{}'::jsonb)
    from jsonb_each(p) e
    where e.key in ('name', 'city', 'venue', 'start_date', 'end_date', 'match_format', 'competition', 'teams_planned',
      'ball', 'side_format', 'players_per_side', 'min_squad', 'max_squad', 'registration_opens', 'registration_deadline')
  ));
  -- One day of slack for callers whose local date is behind the server's.
  if t.start_date < current_date - 1 then
    raise exception 'Choose today or a future start date' using errcode = '22023';
  end if;
  insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
    teams_planned, ball, side_format, players_per_side, min_squad, max_squad, registration_opens, registration_deadline)
  values (v_id, v_uid, btrim(t.name), btrim(t.city), btrim(t.venue), t.start_date, t.end_date, t.match_format,
    t.competition, t.teams_planned, t.ball, t.side_format, t.players_per_side, t.min_squad, t.max_squad,
    t.registration_opens, t.registration_deadline);
  insert into public.tournament_staff (tournament_id, user_id, role) values (v_id, v_uid, 'owner');
  return v_id;
exception when check_violation or not_null_violation or invalid_datetime_format or datetime_field_overflow
  or invalid_text_representation or numeric_value_out_of_range then
  raise exception 'Tournament details are not valid: %', sqlerrm using errcode = '22023';
end;
$$;

-- Staff create a new team inside the tournament (the caller owns it) and enter it, in one transaction.
create function public.create_tournament_team(
  p_tournament uuid, p_team uuid, p_name text, p_short_name text, p_tone text
) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_tournament_change(p_tournament) is null then
    raise exception 'Only tournament staff can add teams' using errcode = '42501';
  end if;
  perform public.insert_team((select auth.uid()), p_team, p_name, p_short_name, p_tone);
  perform public.link_tournament_team(p_tournament, p_team, public.begin_team_change(p_team));
end;
$$;

-- Staff enter a team they own or administer.
create function public.add_tournament_team(p_tournament uuid, p_team uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if public.begin_tournament_change(p_tournament) is null then
    raise exception 'Only tournament staff can add teams' using errcode = '42501';
  end if;
  perform public.link_tournament_team(p_tournament, p_team, public.begin_team_change(p_team));
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants and row level security
-- ---------------------------------------------------------------------------

revoke execute on function public.create_tournament(jsonb), public.create_tournament_team(uuid, uuid, text, text, text),
  public.add_tournament_team(uuid, uuid) from public, anon;
grant execute on function public.create_tournament(jsonb), public.create_tournament_team(uuid, uuid, text, text, text),
  public.add_tournament_team(uuid, uuid) to authenticated;

revoke all on public.tournaments, public.tournament_staff, public.tournament_teams from anon;
revoke insert, update, delete, truncate on public.tournaments, public.tournament_staff, public.tournament_teams
  from authenticated;

alter table public.tournaments enable row level security;
alter table public.tournament_staff enable row level security;
alter table public.tournament_teams enable row level security;

create policy "tournaments: signed-in users can read"
  on public.tournaments for select to authenticated using (true);
create policy "tournament_staff: signed-in users can read"
  on public.tournament_staff for select to authenticated using (true);
create policy "tournament_teams: signed-in users can read"
  on public.tournament_teams for select to authenticated using (true);
