-- Verification for the tournament owner adding players directly (migration 20261114234500).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Accounts: 1 tournament owner, 2 owner of team A (and admin of team B), 3 player of A, 4 staff of A,
-- 5 owner of team B, 6 stranger. Teams A and B are entered in tournament T.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f9a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'owner-adds-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Squads test ' || n), now(), now()
from generate_series(1, 6) n;
insert into public.profiles (id, full_name)
select id, 'Squads test' from auth.users where email like 'owner-adds-test-%' on conflict (id) do nothing;

select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_tournament(jsonb_build_object('id', 'f9c00000-0000-4000-8000-000000000001', 'name', 'Squad Cup',
  'city', 'Chattogram', 'venue', 'Main Ground', 'start_date', current_date + 7, 'end_date', current_date + 9,
  'match_format', 'T20', 'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'gully_6',
  'players_per_side', 6, 'min_squad', 6, 'max_squad', 8, 'registration_deadline', current_date - 1 + 7));
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.create_team('f9b00000-0000-4000-8000-00000000000a', 'Alpha XI', 'AXI');
select set_config('request.jwt.claims', '{"sub":"f9a00000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select public.create_team('f9b00000-0000-4000-8000-00000000000b', 'Bravo XI', 'BXI');
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f9b00000-0000-4000-8000-00000000000a', 'f9a00000-0000-4000-8000-000000000003', 'player'),
  ('f9b00000-0000-4000-8000-00000000000a', 'f9a00000-0000-4000-8000-000000000004', 'staff'),
  ('f9b00000-0000-4000-8000-00000000000b', 'f9a00000-0000-4000-8000-000000000002', 'admin');
insert into public.tournament_teams (tournament_id, team_id) values
  ('f9c00000-0000-4000-8000-000000000001', 'f9b00000-0000-4000-8000-00000000000a'),
  ('f9c00000-0000-4000-8000-000000000001', 'f9b00000-0000-4000-8000-00000000000b');
set local role authenticated;

do $$
declare
  t uuid := 'f9c00000-0000-4000-8000-000000000001';
  a uuid := 'f9b00000-0000-4000-8000-00000000000a';
  b uuid := 'f9b00000-0000-4000-8000-00000000000b';
  u3 uuid := 'f9a00000-0000-4000-8000-000000000003';
  u4 uuid := 'f9a00000-0000-4000-8000-000000000004';
  u6 uuid := 'f9a00000-0000-4000-8000-000000000006';
  claims text := '{"sub":"f9a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  code text;
  who text;
begin
  if has_function_privilege('anon', 'public.add_tournament_squad_player(uuid, uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.add_tournament_squad_player(uuid, uuid, uuid)', 'execute') then
    raise exception 'FAIL grants: RPC for authenticated only';
  end if;

  -- a) A player and a stranger cannot add anyone.
  foreach who in array array['3', '6'] loop
    perform set_config('request.jwt.claims', format(claims, who), true);
    begin perform public.add_tournament_squad_player(t, a, u6); code := 'ok'; exception when others then code := sqlstate; end;
    if code is distinct from '42501' then raise exception 'FAIL a: account % gave %', who, code; end if;
  end loop;

  -- b) The tournament owner adds a stranger to team A: they become a player member and are in the squad. A repeat is a no-op.
  perform set_config('request.jwt.claims', format(claims, 1), true);
  perform public.add_tournament_squad_player(t, a, u6);
  perform public.add_tournament_squad_player(t, a, u6);
  if (select role from public.team_members where team_id = a and profile_id = u6) is distinct from 'player'
    or (select count(*) from public.tournament_squads where tournament_id = t and team_id = a and profile_id = u6) <> 1 then
    raise exception 'FAIL b: stranger not added as player and squad member';
  end if;

  -- c) An existing member goes straight into the squad; team staff are refused with 22023.
  perform public.add_tournament_squad_player(t, a, u3);
  code := null;
  begin perform public.add_tournament_squad_player(t, a, u4); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: staff gave %', code; end if;

  -- d) Someone already playing for A cannot be added to B: ET002.
  code := null;
  begin perform public.add_tournament_squad_player(t, b, u6); exception when others then code := sqlstate; end;
  if code is distinct from 'ET002' then raise exception 'FAIL d: clash gave %', code; end if;

  -- e) The tournament owner can now also save a squad with set_tournament_squad.
  perform public.set_tournament_squad(t, a, array[u3]);
  if exists (select 1 from public.tournament_squads where team_id = a and profile_id = u6) then
    raise exception 'FAIL e: set_tournament_squad by the tournament owner did not replace the squad';
  end if;

  raise notice 'PASS tournament owner adds players';
end $$;

rollback;
