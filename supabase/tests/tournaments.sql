-- Verification for tournaments, staff and tournament teams (migration 20261102010000).
--
-- Run as an administrator (SQL editor) after the teams and tournaments migrations are applied. Paste this whole
-- file. Everything runs inside one transaction that is rolled back; the last block proves nothing was left
-- behind. Any failed assertion raises an exception that starts with FAIL.
--
-- Fixture accounts: 1 tournament owner, 2 moderator and admin of team X, 3 owner of team X,
-- 4 moderator and player of team X, 5 stranger. Tournament T has 4 seats.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f5a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'tournaments-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Tournaments test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Tournaments test' from auth.users where email like 'tournaments-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.create_tournament(jsonb)', 'execute')
    or not has_function_privilege('authenticated', 'public.create_tournament(jsonb)', 'execute')
    or not has_function_privilege('authenticated', 'public.add_tournament_team(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.create_tournament_team(uuid, uuid, text, text, text)', 'execute')
    or has_function_privilege('authenticated', 'public.begin_tournament_change(uuid)', 'execute')
    or has_function_privilege('authenticated', 'public.link_tournament_team(uuid, uuid, text)', 'execute')
    or has_function_privilege('authenticated', 'public.insert_team(uuid, uuid, text, text, text, text, text, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.create_team(uuid, text, text, text, text, text, text)', 'execute') then
    raise exception 'FAIL grants: public functions for authenticated only, internal functions for nobody';
  end if;
  if has_table_privilege('authenticated', 'public.tournaments', 'insert, update, delete')
    or has_table_privilege('authenticated', 'public.tournament_staff', 'insert, update, delete')
    or has_table_privilege('authenticated', 'public.tournament_teams', 'insert, update, delete')
    or has_table_privilege('anon', 'public.tournaments', 'select')
    or not has_table_privilege('authenticated', 'public.tournament_teams', 'select') then
    raise exception 'FAIL grants: direct writes must be revoked, reads for authenticated only';
  end if;
end $$;

select set_config('t.t', 'f5c00000-0000-4000-8000-000000000001', true);
select set_config('t.body', jsonb_build_object('id', 'f5c00000-0000-4000-8000-000000000001', 'name', ' Chattogram Cup ',
  'city', 'Chattogram', 'venue', 'MA Aziz Stadium', 'start_date', current_date + 7, 'end_date', current_date + 9,
  'match_format', 'T20', 'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'standard_11',
  'players_per_side', 11, 'min_squad', 14, 'max_squad', 16, 'registration_opens', '', 'registration_deadline',
  current_date + 7, 'owner_id', 'f5a00000-0000-4000-8000-000000000005')::text, true);
select set_config('request.jwt.claims', '{"sub":"f5a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- a) Create and repeat: one tournament owned by the caller (owner_id in the body is ignored), one owner row.
-- b) Invalid fields are 22023 and write nothing. c) Another account's id is 23505. d) Direct writes are 42501.
do $$
declare t uuid := current_setting('t.t')::uuid; body jsonb := current_setting('t.body')::jsonb; bad jsonb; stmt text;
  code text;
begin
  for i in 1..2 loop
    if public.create_tournament(body) is distinct from t then raise exception 'FAIL a: call % returned another id', i; end if;
  end loop;
  if (select name || '/' || owner_id from public.tournaments where id = t) is distinct from 'Chattogram Cup/f5a00000-0000-4000-8000-000000000001'
    or (select registration_opens from public.tournaments where id = t) is not null
    or (select string_agg(user_id || ':' || role, ',') from public.tournament_staff where tournament_id = t)
      is distinct from 'f5a00000-0000-4000-8000-000000000001:owner' then
    raise exception 'FAIL a: wrong tournament or staff rows';
  end if;
  foreach bad in array array[
    '{"name":"ab"}', '{"city":""}', '{"start_date":"2001-01-01","end_date":"2001-01-02","registration_deadline":null}',
    format('{"end_date":"%s"}', current_date + 6), '{"competition":"knockout","teams_planned":6}', '{"teams_planned":5}',
    '{"match_format":"T5"}', '{"ball":"Rubber"}', '{"side_format":"x"}', '{"players_per_side":5}', '{"min_squad":10}',
    '{"max_squad":17}', '{"min_squad":15,"max_squad":14}', format('{"registration_deadline":"%s"}', current_date + 8),
    format('{"registration_opens":"%s","registration_deadline":"%s"}', current_date + 5, current_date + 4),
    '{"start_date":"2026-02-30"}', '{"teams_planned":"eight"}', '{"venue":null}', '{"id":"not-a-uuid"}'
  ]::jsonb[] loop
    code := null;
    begin
      perform public.create_tournament(body || '{"id":"f5c00000-0000-4000-8000-000000000009"}' || bad);
    exception when others then code := sqlstate;
    end;
    if code is distinct from '22023' then raise exception 'FAIL b: % gave %', bad, code; end if;
  end loop;
  if exists (select 1 from public.tournaments where id = 'f5c00000-0000-4000-8000-000000000009') then
    raise exception 'FAIL b: an invalid tournament was written';
  end if;
  perform set_config('request.jwt.claims', '{"sub":"f5a00000-0000-4000-8000-000000000005","role":"authenticated"}', true);
  code := null;
  begin perform public.create_tournament(body); exception when others then code := sqlstate; end;
  if code is distinct from '23505' then raise exception 'FAIL c: reused id gave %', code; end if;
  foreach stmt in array array['insert into public.tournaments (id, owner_id) values (%L, %L)',
    'insert into public.tournament_staff (tournament_id, user_id, role) values (%L, %L, ''moderator'')',
    'insert into public.tournament_teams (tournament_id, team_id) values (%L, %L)',
    'update public.tournaments set name = ''Taken'' where id = %L and %L is not null',
    'delete from public.tournament_staff where tournament_id = %L and user_id <> %L']::text[] loop
    code := null;
    begin
      execute format(stmt, t, 'f5a00000-0000-4000-8000-000000000005');
    exception when others then code := sqlstate;
    end;
    if code is distinct from '42501' then raise exception 'FAIL d: "%" gave %', stmt, code; end if;
  end loop;
end $$;

-- Team X belongs to account 3; account 2 is its admin and account 4 a player. Accounts 2 and 4 are moderators
-- of T (moderators join through invitations, step 13; here the administrator adds them).
select set_config('request.jwt.claims', '{"sub":"f5a00000-0000-4000-8000-000000000003","role":"authenticated"}', true);
select public.create_team('f5b00000-0000-4000-8000-000000000003', 'Xtreme XI', 'XXI');
reset role;
insert into public.team_members (team_id, profile_id, role)
values ('f5b00000-0000-4000-8000-000000000003', 'f5a00000-0000-4000-8000-000000000002', 'admin'),
  ('f5b00000-0000-4000-8000-000000000003', 'f5a00000-0000-4000-8000-000000000004', 'player');
insert into public.tournament_staff (tournament_id, user_id, role)
values (current_setting('t.t')::uuid, 'f5a00000-0000-4000-8000-000000000002', 'moderator'),
  (current_setting('t.t')::uuid, 'f5a00000-0000-4000-8000-000000000004', 'moderator');
set local role authenticated;

-- e) A stranger is refused on both team functions and nothing is written; an unknown tournament is P0002.
-- f) create_tournament_team writes the team, the owner member and the link together, and a repeat adds nothing.
--    The shared team creation still refuses another account's team id (23505).
-- g) add_tournament_team: refused for a staff member who is a plain player of the team; allowed for its admin.
do $$
declare t uuid := current_setting('t.t')::uuid; code text;
  as_user text := '{"sub":"f5a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  team text := 'f5b00000-0000-4000-8000-00000000000%s';
begin
  perform set_config('request.jwt.claims', format(as_user, 5), true);
  begin perform public.create_tournament_team(t, format(team, 7)::uuid, 'Ghosts', 'GHO', 'blue');
  exception when others then code := sqlstate; end;
  if code is distinct from '42501' or exists (select 1 from public.teams where id = format(team, 7)::uuid) then
    raise exception 'FAIL e: a stranger created a tournament team (%)', code;
  end if;
  code := null;
  begin perform public.add_tournament_team(t, format(team, 3)::uuid); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL e: a stranger added a team (%)', code; end if;
  code := null;
  begin perform public.add_tournament_team(format(team, 9)::uuid, format(team, 3)::uuid);
  exception when others then code := sqlstate; end;
  if code is distinct from 'P0002' then raise exception 'FAIL e: an unknown tournament gave %', code; end if;

  perform set_config('request.jwt.claims', format(as_user, 1), true);
  for i in 1..2 loop
    perform public.create_tournament_team(t, format(team, 1)::uuid, ' Agrabad Tigers ', 'agt', 'yellow');
  end loop;
  if (select name || '/' || short_name || '/' || tone from public.teams where id = format(team, 1)::uuid)
      is distinct from 'Agrabad Tigers/AGT/yellow'
    or (select string_agg(profile_id || ':' || role, ',') from public.team_members where team_id = format(team, 1)::uuid)
      is distinct from 'f5a00000-0000-4000-8000-000000000001:owner'
    or (select count(*) from public.tournament_teams
      where tournament_id = t and team_id = format(team, 1)::uuid
        and added_by = 'f5a00000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'FAIL f: team, owner member or link missing or repeated';
  end if;
  code := null;
  begin perform public.create_tournament_team(t, format(team, 3)::uuid, 'Copy', 'CPY', 'blue');
  exception when others then code := sqlstate; end;
  if code is distinct from '23505' then raise exception 'FAIL f: another account''s team id gave %', code; end if;

  perform set_config('request.jwt.claims', format(as_user, 4), true);
  code := null;
  begin perform public.add_tournament_team(t, format(team, 3)::uuid); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL g: a plain player added the team (%)', code; end if;
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  perform public.add_tournament_team(t, format(team, 3)::uuid);
  perform public.add_tournament_team(t, format(team, 3)::uuid);
  perform public.create_tournament_team(t, format(team, 2)::uuid, 'Bayezid Blasters', 'BB', 'neutral');
  if (select count(*) from public.tournament_teams where tournament_id = t) <> 3
    or public.team_role(format(team, 2)::uuid) is distinct from 'owner' then
    raise exception 'FAIL g: expected teams A, X and B in the tournament, B owned by the moderator';
  end if;
end $$;

-- h) ET001 at the seat limit (4): nothing is created or linked, and repeats of entered teams still return OK.
-- i) Exactly one owner row per tournament. j) Signed out is 42501.
do $$
declare t uuid := current_setting('t.t')::uuid; code text;
  as_user text := '{"sub":"f5a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  team text := 'f5b00000-0000-4000-8000-00000000000%s';
begin
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  perform public.create_tournament_team(t, format(team, 4)::uuid, 'Chawkbazar Kings', 'CK', 'blue');
  perform public.create_team(format(team, 6)::uuid, 'Eidgah Eagles', 'EE');
  begin perform public.create_tournament_team(t, format(team, 5)::uuid, 'Dewanhat Daredevils', 'DD', 'blue');
  exception when others then code := sqlstate; end;
  if code is distinct from 'ET001' or exists (select 1 from public.teams where id = format(team, 5)::uuid) then
    raise exception 'FAIL h: a fifth new team gave % or was left behind', code;
  end if;
  code := null;
  begin perform public.add_tournament_team(t, format(team, 6)::uuid); exception when others then code := sqlstate; end;
  if code is distinct from 'ET001' then raise exception 'FAIL h: a fifth own team gave %', code; end if;
  perform public.add_tournament_team(t, format(team, 1)::uuid);
  perform public.create_tournament_team(t, format(team, 4)::uuid, 'Chawkbazar Kings', 'CK', 'blue');
  if (select count(*) from public.tournament_teams where tournament_id = t) <> 4 then
    raise exception 'FAIL h: the tournament does not hold exactly 4 teams';
  end if;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  code := null;
  begin perform public.create_tournament(current_setting('t.body')::jsonb); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL j: signed out create gave %', code; end if;
  code := null;
  begin perform public.add_tournament_team(t, format(team, 6)::uuid); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL j: signed out add gave %', code; end if;
end $$;

reset role;
do $$
declare code text;
begin
  begin
    insert into public.tournament_staff (tournament_id, user_id, role)
    values (current_setting('t.t')::uuid, 'f5a00000-0000-4000-8000-000000000005', 'owner');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '23505' then raise exception 'FAIL i: a second owner row gave %', code; end if;
  if (select count(*) from public.tournament_staff where tournament_id = current_setting('t.t')::uuid and role = 'owner') <> 1 then
    raise exception 'FAIL i: the tournament does not have exactly one owner row';
  end if;
end $$;

rollback;

-- Nothing from this script persisted.
do $$
begin
  if exists (select 1 from auth.users where email like 'tournaments-test-%')
    or exists (select 1 from public.tournaments where id::text like 'f5c00000-0000-4000-8000-%')
    or exists (select 1 from public.teams where id::text like 'f5b00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'tournaments verification passed';
end $$;
