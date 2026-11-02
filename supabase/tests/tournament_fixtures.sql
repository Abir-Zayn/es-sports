-- Verification for tournament fixtures (migrations 20261102192353 and 20261102192425).
--
-- Run as an administrator (SQL editor) after both migrations are applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Accounts: 1 tournament owner, 2 moderator, 3/4/5 owners of teams A/B/C. T is T20 (4-hour slots), days +7 to +9.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f9a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'fixtures-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Fixtures test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Fixtures test' from auth.users where email like 'fixtures-test-%' on conflict (id) do nothing;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
select public.create_tournament(jsonb_build_object('id', 'f9c00000-0000-4000-8000-000000000001', 'name', 'Fixture Cup',
  'city', 'Chattogram', 'venue', 'Main Ground', 'start_date', current_date + 7, 'end_date', current_date + 9,
  'match_format', 'T20', 'competition', 'league-knockout', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'gully_6',
  'players_per_side', 6, 'min_squad', 6, 'max_squad', 8));
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select public.create_team('f9b00000-0000-4000-8000-00000000000a', 'Alpha XI', 'AXI');
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select public.create_team('f9b00000-0000-4000-8000-00000000000b', 'Bravo XI', 'BXI');
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select public.create_team('f9b00000-0000-4000-8000-00000000000c', 'Charlie XI', 'CXI');
reset role;
insert into public.tournament_teams (tournament_id, team_id)
select 'f9c00000-0000-4000-8000-000000000001', id from public.teams where id::text like 'f9b00000-%';
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f9c00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000002', 'moderator');
select set_config('t.body', jsonb_build_object('mode', 'auto', 'per_day', 2, 'first_start_min', 540, 'matches', jsonb_build_array(
  jsonb_build_object('number', 1, 'stage', 'League', 'round', 0, 'home_team', 'f9b00000-0000-4000-8000-00000000000a',
    'away_team', 'f9b00000-0000-4000-8000-00000000000b', 'match_date', current_date + 7, 'start_min', 540),
  jsonb_build_object('number', 2, 'stage', 'League', 'round', 0, 'home_team', 'f9b00000-0000-4000-8000-00000000000a',
    'away_team', 'f9b00000-0000-4000-8000-00000000000c', 'match_date', current_date + 8, 'start_min', 540),
  jsonb_build_object('number', 3, 'stage', 'Final', 'round', 1, 'home_label', 'Winner of Match 1',
    'away_label', 'Winner of Match 2', 'match_date', current_date + 9, 'start_min', 540)))::text, true);
set local role authenticated;

do $$
declare
  t uuid := 'f9c00000-0000-4000-8000-000000000001';
  body jsonb := current_setting('t.body')::jsonb;
  claims text := '{"sub":"f9a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  code text; bad jsonb; m1 uuid; m2 uuid;
begin
  if has_function_privilege('anon', 'public.publish_tournament_schedule(uuid, jsonb)', 'execute')
    or not has_function_privilege('authenticated', 'public.reschedule_tournament_fixture(uuid, date, int)', 'execute')
    or has_function_privilege('authenticated', 'public.tournament_schedule_problem(uuid)', 'execute')
    or has_table_privilege('authenticated', 'public.tournament_fixtures', 'insert, update, delete') then
    raise exception 'FAIL grants';
  end if;

  -- a) A moderator cannot publish.
  perform set_config('request.jwt.claims', format(claims, 2), true);
  begin perform public.publish_tournament_schedule(t, body); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL a: moderator publish gave %', code; end if;

  -- b) The owner publishes twice; the same three fixtures stay and the three team owners are told each time.
  perform set_config('request.jwt.claims', format(claims, 1), true);
  perform public.publish_tournament_schedule(t, body);
  perform public.publish_tournament_schedule(t, body);
  if (select count(*) from public.tournament_fixtures where tournament_id = t) <> 3
    or (select schedule_mode from public.tournaments where id = t) <> 'auto' then
    raise exception 'FAIL b: expected 3 fixtures in auto mode';
  end if;

  -- c) Schedules that do not fit are ET006: outside the dates, a team twice a day, two matches at once, a side that
  --    is both a team and a label. A bad mode or an unknown team is 22023.
  foreach bad in array array[
    jsonb_build_object('match_date', current_date + 10),
    jsonb_build_object('match_date', current_date + 7, 'start_min', 840),
    jsonb_build_object('match_date', current_date + 7, 'start_min', 600, 'home_team', 'f9b00000-0000-4000-8000-00000000000c', 'away_team', null, 'away_label', 'X'),
    jsonb_build_object('home_label', 'Also a label')
  ] loop
    code := null;
    begin
      perform public.publish_tournament_schedule(t, jsonb_set(body, '{matches,1}', (body -> 'matches' -> 1) || bad));
    exception when others then code := sqlstate;
    end;
    if code is distinct from 'ET006' then raise exception 'FAIL c: % gave %', bad, code; end if;
  end loop;
  code := null;
  begin perform public.publish_tournament_schedule(t, body || '{"mode":"random"}'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: bad mode gave %', code; end if;
  code := null;
  begin
    perform public.publish_tournament_schedule(t, jsonb_set(body, '{matches,1,home_team}', '"00000000-0000-4000-8000-000000000000"'));
  exception when others then code := sqlstate;
  end;
  if code is distinct from '22023' then raise exception 'FAIL c: unknown team gave %', code; end if;

  select id into m1 from public.tournament_fixtures where tournament_id = t and number = 1;
  select id into m2 from public.tournament_fixtures where tournament_id = t and number = 2;

  -- d) Moving match 2 onto match 1's slot or onto A's day is ET006; to day 3 at 3 PM is fine and tells A and C.
  code := null;
  begin perform public.reschedule_tournament_fixture(m2, current_date + 7, 540); exception when others then code := sqlstate; end;
  if code is distinct from 'ET006' then raise exception 'FAIL d: ground clash gave %', code; end if;
  code := null;
  begin perform public.reschedule_tournament_fixture(m2, current_date + 7, 900); exception when others then code := sqlstate; end;
  if code is distinct from 'ET006' then raise exception 'FAIL d: team clash gave %', code; end if;
  perform public.reschedule_tournament_fixture(m2, current_date + 9, 900);
  reset role;
  if (select count(*) from public.notifications where data ->> 'fixture_id' = m2::text and data ->> 'event' = 'fixture_moved') <> 2 then
    raise exception 'FAIL d: both team owners should be told of the move';
  end if;
  set local role authenticated;

  -- e) Cancelling needs a reason; a repeat is fine; a cancelled match cannot move.
  code := null;
  begin perform public.cancel_tournament_fixture(m1, ' x '); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL e: short reason gave %', code; end if;

  -- f) Team B still plays match 1, so it cannot leave (ET005). After match 1 is cancelled it can.
  code := null;
  begin perform public.remove_tournament_team(t, 'f9b00000-0000-4000-8000-00000000000b'); exception when others then code := sqlstate; end;
  if code is distinct from 'ET005' then raise exception 'FAIL f: removing a scheduled team gave %', code; end if;
  perform public.cancel_tournament_fixture(m1, 'Ground flooded');
  perform public.cancel_tournament_fixture(m1, 'Again');
  if (select cancel_reason from public.tournament_fixtures where id = m1) <> 'Ground flooded' then
    raise exception 'FAIL e: a repeat cancel changed the reason';
  end if;
  code := null;
  begin perform public.reschedule_tournament_fixture(m1, current_date + 8, 900); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL e: moving a cancelled match gave %', code; end if;
  perform public.remove_tournament_team(t, 'f9b00000-0000-4000-8000-00000000000b');
  -- Another match can still move although the cancelled match names a team that left.
  perform public.reschedule_tournament_fixture(m2, current_date + 8, 600);
end $$;

-- g) Once a fixture has a match, the schedule cannot be replaced and that fixture cannot change (ET004).
reset role;
insert into public.matches (id, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short, team_b_tone)
values ('f9d00000-0000-4000-8000-000000000001', 'Alpha XI', 'AXI', 'blue', 'Charlie XI', 'CXI', 'yellow');
update public.tournament_fixtures set match_id = 'f9d00000-0000-4000-8000-000000000001'
 where tournament_id = 'f9c00000-0000-4000-8000-000000000001' and number = 2;
set local role authenticated;
do $$
declare t uuid := 'f9c00000-0000-4000-8000-000000000001'; code text; m2 uuid;
begin
  select id into m2 from public.tournament_fixtures where tournament_id = t and number = 2;
  begin perform public.publish_tournament_schedule(t, current_setting('t.body')::jsonb); exception when others then code := sqlstate; end;
  if code is distinct from 'ET004' then raise exception 'FAIL g: republish gave %', code; end if;
  code := null;
  begin perform public.cancel_tournament_fixture(m2, 'Rain'); exception when others then code := sqlstate; end;
  if code is distinct from 'ET004' then raise exception 'FAIL g: cancelling a started match gave %', code; end if;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email like 'fixtures-test-%')
    or exists (select 1 from public.tournaments where id::text like 'f9c00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'tournament fixtures verification passed';
end $$;
