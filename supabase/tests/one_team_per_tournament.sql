-- Verification for one team per person per tournament (migration 20261102040000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Fixture accounts: 1 organiser of tournaments T and U, 2 invited team owner, 3 player, 4 moderator of T who owns
-- team D outside it. T and U have 4 seats each.

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

-- a) The organiser creates T and U and three teams: A and B in T, C in U. Owning several of them as the creator is
--    a placeholder and is allowed.
do $$
declare body jsonb := jsonb_build_object('name', 'One Team Cup', 'city', 'Chattogram', 'venue', 'Main Ground',
  'start_date', current_date + 7, 'end_date', current_date + 9, 'match_format', 'T20', 'competition', 'league',
  'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'standard_11', 'players_per_side', 11, 'min_squad', 11, 'max_squad', 16);
begin
  perform public.create_tournament(body || '{"id":"f7c00000-0000-4000-8000-00000000000a"}');
  perform public.create_tournament(body || '{"id":"f7c00000-0000-4000-8000-00000000000b"}');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000a', 'Alpha XI', 'AXI', 'neutral');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000b', 'Bravo XI', 'BXI', 'neutral');
  perform public.create_tournament_team('f7c00000-0000-4000-8000-00000000000b', 'f7b00000-0000-4000-8000-00000000000c', 'Charlie XI', 'CXI', 'neutral');
  if (select count(*) from public.team_members where profile_id = 'f7a00000-0000-4000-8000-000000000001' and role = 'owner') <> 3 then
    raise exception 'FAIL a: the organiser should own all three new teams';
  end if;
end $$;

-- b) Account 2 accepts ownership of A. Then an owner invite for B in the same tournament is ET002 and stores
--    nothing, while ownership of C in tournament U is fine.
do $$
declare inv uuid; code text;
  as_user text := '{"sub":"f7a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  inv := public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000a', 'f7a00000-0000-4000-8000-000000000002');
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  perform public.accept_invitation(inv);
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  begin
    perform public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000a', 'f7b00000-0000-4000-8000-00000000000b', 'f7a00000-0000-4000-8000-000000000002');
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'ET002' then raise exception 'FAIL b: second owner invite in T gave %', code; end if;
  if exists (select 1 from public.invitations where team_id = 'f7b00000-0000-4000-8000-00000000000b') then
    raise exception 'FAIL b: the refused invitation was stored';
  end if;
  inv := public.send_team_owner_invite('f7c00000-0000-4000-8000-00000000000b', 'f7b00000-0000-4000-8000-00000000000c', 'f7a00000-0000-4000-8000-000000000002');
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  perform public.accept_invitation(inv);
  if (select count(*) from public.team_members where profile_id = 'f7a00000-0000-4000-8000-000000000002' and role = 'owner') <> 2 then
    raise exception 'FAIL b: account 2 should own A (tournament T) and C (tournament U)';
  end if;
  perform set_config('request.jwt.claims', format(as_user, 1), true);
end $$;

-- c) Any direct membership change is checked too: account 2 cannot also play for B; account 3 plays for A and C
--    (two tournaments) but not for B. Account 1, now an admin of A, may still play for C.
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f7b00000-0000-4000-8000-00000000000a', 'f7a00000-0000-4000-8000-000000000003', 'player'),
  ('f7b00000-0000-4000-8000-00000000000c', 'f7a00000-0000-4000-8000-000000000003', 'player');
do $$
declare stmt text; code text;
begin
  foreach stmt in array array[
    'insert into public.team_members (team_id, profile_id, role) values (''f7b00000-0000-4000-8000-00000000000b'', ''f7a00000-0000-4000-8000-000000000002'', ''player'')',
    'insert into public.team_members (team_id, profile_id, role) values (''f7b00000-0000-4000-8000-00000000000b'', ''f7a00000-0000-4000-8000-000000000003'', ''player'')'
  ]::text[] loop
    code := null;
    begin execute stmt; exception when others then code := sqlstate; end;
    if code is distinct from 'ET002' then raise exception 'FAIL c: "%" gave %', stmt, code; end if;
  end loop;
  -- Management roles do not count: account 3 may be staff of B.
  insert into public.team_members (team_id, profile_id, role) values ('f7b00000-0000-4000-8000-00000000000b', 'f7a00000-0000-4000-8000-000000000003', 'staff');
  code := null;
  begin
    update public.team_members set role = 'player' where team_id = 'f7b00000-0000-4000-8000-00000000000b' and profile_id = 'f7a00000-0000-4000-8000-000000000003';
  exception when others then code := sqlstate;
  end;
  if code is distinct from 'ET002' then raise exception 'FAIL c: promoting staff to player in a second team gave %', code; end if;
end $$;

-- d) A team entering T is refused when one of its players already plays for another team in T. Account 4 is a
--    moderator of T and owns team D, where account 3 plays.
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
select 'PASS one team per tournament' as result;
rollback;
