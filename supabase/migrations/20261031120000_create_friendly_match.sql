-- Creates a friendly match, its squads and its optional scorer in one transaction.
--
-- * Before this, the app wrote `matches`, `match_players` and `match_scorers` in three requests, so a failure
--   partway left a match with no squads or no scorer. This function writes all of them or none of them.
-- * Security invoker: the existing row level security policies stay the security boundary.
-- * The client chooses only the setup columns. The server sets `status`, `started_at` and `created_by`, and
--   ignores every other key (results, ownership).
-- * Idempotent on the match id. A repeat call by the creator returns the id and writes nothing. An older
--   partial match (no players, still scheduled) is completed. Another user's id is rejected.
-- * Concurrent calls with one id are serialized by a transaction advisory lock on the id, taken before any
--   row lock. The second call waits, then finds the finished match and returns it. The match insert also
--   uses `on conflict (id) do nothing`, so the waiting call never raises a duplicate key error.
-- * Players are inserted before the scorer: once a friendly has a scorer, only that scorer passes
--   `can_score_match`, so the creator could no longer add the squads.

create function public.create_friendly_match(p_match jsonb, p_players jsonb, p_scorer uuid default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_row public.matches;
  v_existing public.matches;
  v_player jsonb;
begin
  if v_uid is null then
    raise exception 'Sign in to create a friendly match' using errcode = '42501';
  end if;

  -- Match payload.
  if p_match is null or jsonb_typeof(p_match) <> 'object' then
    raise exception 'Match details must be a JSON object' using errcode = '22023';
  end if;
  if coalesce(p_match ->> 'id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    raise exception 'Match id must be a uuid' using errcode = '22023';
  end if;
  v_id := (p_match ->> 'id')::uuid;
  if coalesce(p_match ->> 'fixture_ref', '') not like 'friendly-%' then
    raise exception 'A friendly match needs a fixture_ref that starts with friendly-' using errcode = '22023';
  end if;
  -- Only the setup columns are read. Any other key, valid or not, is ignored.
  v_row := jsonb_populate_record(null::public.matches, (
    select coalesce(jsonb_object_agg(e.key, e.value), '{}'::jsonb) from jsonb_each(p_match) e
    where e.key in ('fixture_ref', 'title', 'team_a_name', 'team_a_short', 'team_a_tone', 'team_a_image_url',
      'team_b_name', 'team_b_short', 'team_b_tone', 'team_b_image_url', 'overs_limit', 'toss_winner_side',
      'toss_decision', 'record_shots')
  ));

  -- Players payload.
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

  -- One call per match id at a time. Released when the transaction ends.
  perform pg_advisory_xact_lock(hashtextextended('create_friendly_match:' || v_id::text, 0));

  insert into public.matches (
    id, fixture_ref, created_by, title,
    team_a_name, team_a_short, team_a_tone, team_a_image_url,
    team_b_name, team_b_short, team_b_tone, team_b_image_url,
    overs_limit, status, toss_winner_side, toss_decision, record_shots, started_at
  ) values (
    v_id, v_row.fixture_ref, v_uid, v_row.title,
    v_row.team_a_name, v_row.team_a_short, v_row.team_a_tone, v_row.team_a_image_url,
    v_row.team_b_name, v_row.team_b_short, v_row.team_b_tone, v_row.team_b_image_url,
    coalesce(v_row.overs_limit, 20), 'scheduled', v_row.toss_winner_side, v_row.toss_decision,
    coalesce(v_row.record_shots, true), null
  )
  on conflict (id) do nothing;

  select * into v_existing from public.matches where id = v_id;
  if not found or v_existing.created_by is distinct from v_uid then
    raise exception 'This match id belongs to another account' using errcode = '42501';
  end if;
  if coalesce(v_existing.fixture_ref, '') not like 'friendly-%' then
    raise exception 'This match id belongs to a match that is not a friendly' using errcode = '22023';
  end if;

  -- Already complete: a repeat call or a retry after a lost reply.
  if exists (select 1 from public.match_players where match_id = v_id) then
    return v_id;
  end if;
  -- A partial match from the old three-request flow can be completed only before scoring starts.
  if v_existing.status <> 'scheduled' then
    raise exception 'This match has no squads and has already started' using errcode = '55000';
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
$$;

revoke execute on function public.create_friendly_match(jsonb, jsonb, uuid) from public, anon;
grant execute on function public.create_friendly_match(jsonb, jsonb, uuid) to authenticated;
