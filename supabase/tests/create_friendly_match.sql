-- Verification for public.create_friendly_match (migration 20261031120000).
--
-- Run as an administrator (SQL editor, or psql as postgres) after the migration is applied. Everything runs
-- inside one transaction that is rolled back; the last block proves nothing was left behind. Any failed
-- assertion raises an exception that starts with FAIL.
--
-- Concurrency check by hand (not automatable in one session):
--   1. Session A: begin; set local role authenticated;
--      select set_config('request.jwt.claims', '{"sub":"<your user id>","role":"authenticated"}', true);
--      select public.create_friendly_match('<match json with id X>', '<players json>');   -- leave open
--   2. Session B: same three statements with the same id X. It must wait (advisory lock), not fail.
--   3. Session A: commit. Session B returns X without an error.
--   4. select count(*) from public.match_players where match_id = X;  -- one set of players, not two.
--   5. Clean up: matches cannot be deleted by `authenticated`; delete X as an administrator.

begin;

-- Fixture accounts: creator, assigned scorer, another user, a user who is not in the squads.
insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'friendly-rpc-test-' || u.n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'RPC test ' || u.n), now(), now()
from (values (1, 'f3a00000-0000-4000-8000-000000000001'::uuid), (2, 'f3a00000-0000-4000-8000-000000000002'::uuid),
  (3, 'f3a00000-0000-4000-8000-000000000003'::uuid), (4, 'f3a00000-0000-4000-8000-000000000004'::uuid)) u(n, id);
insert into public.profiles (id, full_name)
select id, 'RPC test' from auth.users where email like 'friendly-rpc-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.create_friendly_match(jsonb, jsonb, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.create_friendly_match(jsonb, jsonb, uuid)', 'execute') then
    raise exception 'FAIL grants: only authenticated may execute create_friendly_match';
  end if;
end $$;

-- Shared payloads. Each block replaces the id (and anything else it tests).
select set_config('t.match', '{"fixture_ref":"friendly-rpc-test","title":"RPC test","team_a_name":"Alpha",'
  || '"team_a_short":"ALP","team_a_tone":"blue","team_b_name":"Beta","team_b_short":"BET","team_b_tone":"yellow",'
  || '"overs_limit":6,"toss_winner_side":"a","toss_decision":"bat","record_shots":false}', true);
select set_config('t.players', '[{"key":"p1","side":"a","name":"Creator","sort_order":0,"in_playing_xi":true,'
  || '"profile_id":"f3a00000-0000-4000-8000-000000000001"},{"key":"p2","side":"b","name":"Scorer","sort_order":0,'
  || '"in_playing_xi":true,"profile_id":"f3a00000-0000-4000-8000-000000000002"},'
  || '{"key":"p3","side":"b","name":"Guest","sort_order":1,"in_playing_xi":true}]', true);
select set_config('request.jwt.claims', '{"sub":"f3a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- a) A complete create returns the id with 1 match, 3 players and the scorer. b) A repeat adds nothing.
do $$
declare
  m uuid := 'f3b00000-0000-4000-8000-000000000001';
  p jsonb := jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(m::text));
  r uuid;
begin
  for i in 1..2 loop
    r := public.create_friendly_match(p, current_setting('t.players')::jsonb, 'f3a00000-0000-4000-8000-000000000002');
    if r is distinct from m then raise exception 'FAIL a/b: call % returned %', i, r; end if;
    if (select count(*) from public.matches where id = m) <> 1
      or (select count(*) from public.match_players where match_id = m) <> 3
      or (select count(*) from public.match_scorers where match_id = m) <> 1
      or not exists (select 1 from public.match_scorers where match_id = m
        and user_id = 'f3a00000-0000-4000-8000-000000000002') then
      raise exception 'FAIL a/b: wrong row counts after call %', i;
    end if;
  end loop;
end $$;

-- c) d) e) Rejected calls write nothing. c2 fails after the match insert (duplicate player key), so it also
-- proves the match row is rolled back with the players.
do $$
declare
  base jsonb := current_setting('t.match')::jsonb;
  players jsonb := current_setting('t.players')::jsonb;
  cases text[] := array['c', 'c2', 'd', 'e'];
  ids uuid[] := array['f3b00000-0000-4000-8000-000000000003', 'f3b00000-0000-4000-8000-000000000004',
    'f3b00000-0000-4000-8000-000000000005', 'f3b00000-0000-4000-8000-000000000006']::uuid[];
  rejected boolean;
begin
  for i in 1..4 loop
    rejected := false;
    begin
      perform public.create_friendly_match(
        jsonb_set(case when cases[i] = 'e' then jsonb_set(base, '{fixture_ref}', '"tournament-rpc-test"') else base end,
          '{id}', to_jsonb(ids[i]::text)),
        case cases[i]
          when 'c' then jsonb_set(players, '{2,side}', '"c"')
          when 'c2' then jsonb_set(players, '{2,key}', '"p1"')
          else players end,
        case when cases[i] = 'd' then 'f3a00000-0000-4000-8000-000000000004'::uuid end);
    exception when others then
      rejected := true;
    end;
    if not rejected then raise exception 'FAIL %: the call was accepted', cases[i]; end if;
    if exists (select 1 from public.matches where id = ids[i])
      or exists (select 1 from public.match_players where match_id = ids[i]) then
      raise exception 'FAIL %: rows were left behind', cases[i];
    end if;
  end loop;
end $$;

-- f) Another user reusing the creator's id is rejected and changes nothing.
select set_config('request.jwt.claims', '{"sub":"f3a00000-0000-4000-8000-000000000003","role":"authenticated"}', true);
do $$
declare
  m uuid := 'f3b00000-0000-4000-8000-000000000001';
  rejected boolean := false;
begin
  begin
    perform public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(m::text)),
      current_setting('t.players')::jsonb, null);
  exception when others then rejected := true;
  end;
  if not rejected then raise exception 'FAIL f: another user reused the id'; end if;
  if (select created_by from public.matches where id = m) <> 'f3a00000-0000-4000-8000-000000000001'
    or (select count(*) from public.match_players where match_id = m) <> 3 then
    raise exception 'FAIL f: the match changed';
  end if;
end $$;
select set_config('request.jwt.claims', '{"sub":"f3a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);

-- g) Server-owned columns sent by the client are ignored. h) A legacy partial match is completed.
do $$
declare
  g uuid := 'f3b00000-0000-4000-8000-000000000007';
  h uuid := 'f3b00000-0000-4000-8000-000000000008';
  v_row public.matches;
  r uuid;
begin
  perform public.create_friendly_match(current_setting('t.match')::jsonb || jsonb_build_object('id', g,
    'status', 'completed', 'created_by', 'f3a00000-0000-4000-8000-000000000003', 'started_at', now(),
    'result_type', 'runs', 'winner_side', 'a', 'result_margin', 5, 'team_a_runs', 'not a number'),
    current_setting('t.players')::jsonb);
  select * into v_row from public.matches where id = g;
  if v_row.status <> 'scheduled' or v_row.created_by <> 'f3a00000-0000-4000-8000-000000000001'
    or v_row.started_at is not null or v_row.result_type is not null or v_row.team_a_runs is not null then
    raise exception 'FAIL g: client-sent server columns were stored';
  end if;

  insert into public.matches (id, fixture_ref, created_by, team_a_name, team_a_short, team_a_tone,
    team_b_name, team_b_short, team_b_tone, status)
  values (h, 'friendly-rpc-legacy', 'f3a00000-0000-4000-8000-000000000001', 'Alpha', 'ALP', 'blue',
    'Beta', 'BET', 'yellow', 'scheduled');
  -- Call and check in separate statements: one statement's subqueries cannot see the call's own writes.
  r := public.create_friendly_match(jsonb_set(current_setting('t.match')::jsonb, '{id}', to_jsonb(h::text)),
    current_setting('t.players')::jsonb, 'f3a00000-0000-4000-8000-000000000002');
  if r is distinct from h
    or (select count(*) from public.match_players where match_id = h) <> 3
    or (select count(*) from public.match_scorers where match_id = h) <> 1 then
    raise exception 'FAIL h: the legacy partial match was not completed';
  end if;
end $$;

-- i) With a scorer assigned, the creator cannot insert ball events, while the scorer can.
do $$
declare
  m uuid := 'f3b00000-0000-4000-8000-000000000001';
  rejected boolean := false;
begin
  begin
    insert into public.ball_events (id, match_id, innings, kind, striker_key, non_striker_key, bowler_key)
    values (gen_random_uuid(), m, 1, 'innings_start', 'p1', 'p3', 'p2');
  exception when insufficient_privilege then rejected := true;
  end;
  if not rejected then raise exception 'FAIL i: the creator inserted a ball event'; end if;
  perform set_config('request.jwt.claims', '{"sub":"f3a00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  insert into public.ball_events (id, match_id, innings, kind, striker_key, non_striker_key, bowler_key)
  values (gen_random_uuid(), m, 1, 'innings_start', 'p1', 'p3', 'p2');
end $$;

reset role;
rollback;

-- Nothing from this script persisted.
do $$
begin
  if exists (select 1 from auth.users where email like 'friendly-rpc-test-%')
    or exists (select 1 from public.matches where id::text like 'f3b00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'create_friendly_match verification passed';
end $$;
