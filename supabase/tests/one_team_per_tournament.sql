-- Verification for one playing team per person per tournament (migrations 20261102040000 and 20261102050000).
--
-- Run as an administrator (SQL editor) after the migrations are applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Rule: a person may own any number of teams, in one tournament or many, but may play (role `player`) for one team
-- per tournament only. Fixture accounts: 1 organiser of tournaments T and U, 2 owner of several teams, 3 player,
-- 4 moderator of T who owns team D outside it. T and U have 4 seats each.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f7a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'one-team-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'One team test ' || n), now(), now()
from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, 'One team test' from auth.users where email like 'one-team-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('authenticated', 'public.tournament_team_clash(uuid, uuid, text)', 'execute')
    or has_function_privilege('authenticated', 'public.raise_tournament_team_clash(uuid, uuid, text)', 'execute') then
    raise exception 'FAIL grants: the clash helpers must not be callable by clients';
  end if;
end $$;

select set_config('request.jwt.claims', '{"sub":"f7a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- a) The organiser creates T and U and teams A, B, E in T and C in U, owning all four until owners accept.
do $$
declare body jsonb := jsonb_build_object('name', 'One Team Cup', 'city', 'Chattogram', 'venue', 'Main Ground',
  'start_date', current_date + 7, 'end_date', current_date + 9, 'match_format', 'T20', 'competition', 'league',
  'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'standard_11', 'players_per_side', 11, 'min_squad', 11, 'max_squad', 16);
begin
  perform public.create_tournament(body || '{"id":"f7c00000-0000-4000-8000-00000000000a"}');
  perform public.create_tournament(body || '{"id":"f7c00000-0000-4000-8000-00000000000b"}');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000a', 'Alpha XI', 'AXI', 'neutral');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000b', 'Bravo XI', 'BXI', 'neutral');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000e', 'Echo XI', 'EXI', 'neutral');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000b', 'f7b00000-0000-4000-8000-00000000000c', 'Charlie XI', 'CXI', 'neutral');
end $$;

-- b) Account 2 is invited to own A and B (both in T) and C (in U). All three invitations stay open together, and
--    all three acceptances succeed: owning several teams in one tournament is allowed.
do $$
declare team uuid; invs uuid[] := '{}'; inv uuid;
  as_user text := '{"sub":"f7a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  invs := invs || public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000a', 'f7a00000-0000-4000-8000-000000000002');
  invs := invs || public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000b', 'f7a00000-0000-4000-8000-000000000002');
  invs := invs || public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000b', 'f7b00000-0000-4000-8000-00000000000c', 'f7a00000-0000-4000-8000-000000000002');
  if (select count(*) from public.invitations where to_user = 'f7a00000-0000-4000-8000-000000000002' and status = 'pending') <> 3 then
    raise exception 'FAIL b: three open owner invitations expected';
  end if;
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  foreach inv in array invs loop perform public.accept_invitation(inv); end loop;
  if (select count(*) from public.team_members where profile_id = 'f7a00000-0000-4000-8000-000000000002' and role = 'owner') <> 3 then
    raise exception 'FAIL b: account 2 should own A and B (tournament T) and C (tournament U)';
  end if;
  perform set_config('request.jwt.claims', format(as_user, 1), true);
end $$;

-- c) Playing is limited: account 3 plays for A (T) and C (U), but not also for B (T). Account 2, owner of A and B,
--    may still play for E, and only for E. Management roles do not count; promoting them to player does.
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f7b00000-0000-4000-8000-00000000000a', 'f7a00000-0000-4000-8000-000000000003', 'player'),
  ('f7b00000-0000-4000-8000-00000000000c', 'f7a00000-0000-4000-8000-000000000003', 'player'),
  ('f7b00000-0000-4000-8000-00000000000e', 'f7a00000-0000-4000-8000-000000000002', 'player'),
  ('f7b00000-0000-4000-8000-00000000000b', 'f7a00000-0000-4000-8000-000000000003', 'staff');
do $$
declare stmt text; code text;
begin
  foreach stmt in array array[
    'update public.team_members set role = ''player'' where team_id = ''f7b00000-0000-4000-8000-00000000000b'' and profile_id = ''f7a00000-0000-4000-8000-000000000003''',
    'insert into public.team_members (team_id, profile_id, role) values (''f7b00000-0000-4000-8000-00000000000e'', ''f7a00000-0000-4000-8000-000000000003'', ''player'')'
  ]::text[] loop
    code := null;
    begin execute stmt; exception when others then code := sqlstate; end;
    if code is distinct from 'ET002' then raise exception 'FAIL c: "%" gave %', stmt, code; end if;
  end loop;
  -- The organiser, now admin of A and B after handing them over, may play for A.
  update public.team_members set role = 'player'
   where team_id = 'f7b00000-0000-4000-8000-00000000000a' and profile_id = 'f7a00000-0000-4000-8000-000000000001';
end $$;

-- d) A team entering T is refused when one of its players already plays for another team in T. Account 4 is a
--    moderator of T and owns team D, where account 3 plays. D owned by account 2 alone would be fine.
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f7c00000-0000-4000-8000-00000000000a', 'f7a00000-0000-4000-8000-000000000004', 'moderator');
select set_config('request.jwt.claims', '{"sub":"f7a00000-0000-4000-8000-000000000004","role":"authenticated"}', true);
set local role authenticated;
select public.create_team('f7b00000-0000-4000-8000-00000000000d', 'Delta XI', 'DXI');
reset role;
insert into public.team_members (team_id, profile_id, role)
values ('f7b00000-0000-4000-8000-00000000000d', 'f7a00000-0000-4000-8000-000000000003', 'player');
set local role authenticated;
do $$
declare code text;
begin
  begin
    perform public.add_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000d');
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'ET002' then raise exception 'FAIL d: entering D with a player of A gave %', code; end if;
  if exists (select 1 from public.tournament_teams where team_id = 'f7b00000-0000-4000-8000-00000000000d') then
    raise exception 'FAIL d: D was entered';
  end if;
end $$;
reset role;
delete from public.team_members where team_id = 'f7b00000-0000-4000-8000-00000000000d' and profile_id = 'f7a00000-0000-4000-8000-000000000003';
set local role authenticated;
select public.add_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000d');

reset role;
select 'PASS one playing team per tournament' as result;
rollback;
