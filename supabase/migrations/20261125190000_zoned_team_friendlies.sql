-- A zoned team (no owner, e.g. made inside a tournament) can play a friendly when its creator sets the match up; the
-- creator is who answers for it, as in team_owner_id. Its matches stay out of the team ranking, which comes later.
-- (Changed: the permission check on team_a_id / team_b_id; otherwise the definition from 20261125170000_team_sync.)
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
      if not exists (select 1 from public.team_members where team_id = v_team and profile_id = v_uid and role in ('owner', 'admin'))
        and not exists (select 1 from public.teams where id = v_team and created_by = v_uid and public.team_category(id) = 'zoned') then
        raise exception 'Only the team owner, an admin, or the creator of a zoned team can bring this team to a friendly' using errcode = '42501';
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
