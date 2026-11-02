-- Verification for tournament squads (migration 20261102192327).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Accounts: 1 tournament owner, 2 owner of team A (and admin of team B), 3 player of A, 4 staff of A,
-- 5 owner of team B, 6 stranger. Teams A and B are entered in tournament T.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f8a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'squads-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Squads test ' || n), now(), now()
from generate_series(1, 6) n;
insert into public.profiles (id, full_name)
select id, 'Squads test' from auth.users where email like 'squads-test-%' on conflict (id) do nothing;

select set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_tournament(jsonb_build_object('id', 'f8c00000-0000-4000-8000-000000000001', 'name', 'Squad Cup',
  'city', 'Chattogram', 'venue', 'Main Ground', 'start_date', current_date + 7, 'end_date', current_date + 9,
  'match_format', 'T20', 'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'gully_6',
  'players_per_side', 6, 'min_squad', 6, 'max_squad', 8, 'registration_deadline', current_date - 1 + 7));
select set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
select public.create_team('f8b00000-0000-4000-8000-00000000000a', 'Alpha XI', 'AXI');
select set_config('request.jwt.claims', '{"sub":"f8a00000-0000-4000-8000-000000000005","role":"authenticated"}', true);
select public.create_team('f8b00000-0000-4000-8000-00000000000b', 'Bravo XI', 'BXI');
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f8b00000-0000-4000-8000-00000000000a', 'f8a00000-0000-4000-8000-000000000003', 'player'),
  ('f8b00000-0000-4000-8000-00000000000a', 'f8a00000-0000-4000-8000-000000000004', 'staff'),
  ('f8b00000-0000-4000-8000-00000000000b', 'f8a00000-0000-4000-8000-000000000002', 'admin');
insert into public.tournament_teams (tournament_id, team_id) values
  ('f8c00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-00000000000a'),
  ('f8c00000-0000-4000-8000-000000000001', 'f8b00000-0000-4000-8000-00000000000b');
set local role authenticated;

do $$
declare
  t uuid := 'f8c00000-0000-4000-8000-000000000001';
  a uuid := 'f8b00000-0000-4000-8000-00000000000a';
  b uuid := 'f8b00000-0000-4000-8000-00000000000b';
  u2 uuid := 'f8a00000-0000-4000-8000-000000000002';
  u3 uuid := 'f8a00000-0000-4000-8000-000000000003';
  claims text := '{"sub":"f8a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  code text;
  who text;
begin
  if has_function_privilege('anon', 'public.set_tournament_squad(uuid, uuid, uuid[])', 'execute')
    or not has_function_privilege('authenticated', 'public.set_tournament_squad(uuid, uuid, uuid[])', 'execute')
    or has_table_privilege('authenticated', 'public.tournament_squads', 'insert, update, delete')
    or not has_table_privilege('authenticated', 'public.tournament_squads', 'select') then
    raise exception 'FAIL grants: RPC for authenticated, reads only, no direct writes';
  end if;

  -- a) Only the team owner or an admin: a player, the tournament owner and a stranger are 42501.
  foreach who in array array['3', '1', '6'] loop
    perform set_config('request.jwt.claims', format(claims, who), true);
    code := null;
    begin perform public.set_tournament_squad(t, a, array[u3]); exception when others then code := sqlstate; end;
    if code is distinct from '42501' then raise exception 'FAIL a: account % gave %', who, code; end if;
  end loop;

  -- b) The owner of A saves two players; a repeat changes nothing; then drops one.
  perform set_config('request.jwt.claims', format(claims, 2), true);
  perform public.set_tournament_squad(t, a, array[u2, u3]);
  perform public.set_tournament_squad(t, a, array[u3, u2]);
  if (select count(*) from public.tournament_squads where tournament_id = t and team_id = a) <> 2 then
    raise exception 'FAIL b: expected two players in A';
  end if;
  perform public.set_tournament_squad(t, a, array[u3]);
  if (select string_agg(profile_id::text, ',') from public.tournament_squads where team_id = a) is distinct from u3::text then
    raise exception 'FAIL b: replacing the squad did not drop the other player';
  end if;

  -- c) Staff, a non-member, a duplicate and a null are 22023.
  foreach code in array array[
    'f8a00000-0000-4000-8000-000000000004', 'f8a00000-0000-4000-8000-000000000006'
  ] loop
    who := null;
    begin perform public.set_tournament_squad(t, a, array[code::uuid]); exception when others then who := sqlstate; end;
    if who is distinct from '22023' then raise exception 'FAIL c: % gave %', code, who; end if;
  end loop;
  who := null;
  begin perform public.set_tournament_squad(t, a, array[u3, u3]); exception when others then who := sqlstate; end;
  if who is distinct from '22023' then raise exception 'FAIL c: duplicate gave %', who; end if;
  who := null;
  begin perform public.set_tournament_squad(t, a, array[u3, null]); exception when others then who := sqlstate; end;
  if who is distinct from '22023' then raise exception 'FAIL c: null gave %', who; end if;

  -- d) Account 2 is in B's squad (as B's admin, saved by B's owner); A cannot also list them (ET002).
  perform set_config('request.jwt.claims', format(claims, 5), true);
  perform public.set_tournament_squad(t, b, array[u2]);
  perform set_config('request.jwt.claims', format(claims, 2), true);
  code := null;
  begin perform public.set_tournament_squad(t, a, array[u2, u3]); exception when others then code := sqlstate; end;
  if code is distinct from 'ET002' then raise exception 'FAIL d: a second squad gave %', code; end if;
end $$;

-- e) Leaving the team or the tournament removes the squad rows.
reset role;
delete from public.team_members where team_id = 'f8b00000-0000-4000-8000-00000000000a' and profile_id = 'f8a00000-0000-4000-8000-000000000003';
delete from public.tournament_teams where team_id = 'f8b00000-0000-4000-8000-00000000000b';
do $$
begin
  if exists (select 1 from public.tournament_squads where tournament_id = 'f8c00000-0000-4000-8000-000000000001') then
    raise exception 'FAIL e: squad rows outlived the membership or the entry';
  end if;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email like 'squads-test-%')
    or exists (select 1 from public.tournaments where id::text like 'f8c00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'tournament squads verification passed';
end $$;
