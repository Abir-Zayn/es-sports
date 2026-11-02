-- Verification for removing moderators and teams (migration 20261103000000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back; the last block proves nothing was left behind. Any failed assertion
-- raises an exception that starts with FAIL.
--
-- Accounts: 1 tournament owner, 2 moderator, 3 invited as moderator (pending), 4 owner of team X, 5 stranger.
-- Team X (a real team owned by 4) and team Y (made inside the tournament, no owner yet) are entered in T.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f6a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'removal-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Removal test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Removal test' from auth.users where email like 'removal-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.remove_tournament_moderator(uuid, uuid)', 'execute')
    or has_function_privilege('anon', 'public.remove_tournament_team(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.remove_tournament_moderator(uuid, uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.remove_tournament_team(uuid, uuid)', 'execute') then
    raise exception 'FAIL grants: both functions for authenticated only';
  end if;
end $$;

-- Tournament T owned by 1; team X owned by 4; team Y made inside T by 1 (ownerless).
select set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_tournament(jsonb_build_object('id', 'f6c00000-0000-4000-8000-000000000001', 'name', 'Removal Cup',
  'city', 'Chattogram', 'venue', 'Main Ground', 'start_date', current_date + 7, 'end_date', current_date + 9,
  'match_format', 'T20', 'competition', 'league', 'teams_planned', 4, 'ball', 'Tennis', 'side_format', 'gully_6',
  'players_per_side', 6, 'min_squad', 8, 'max_squad', 10));
select public.create_tournament_team('f6c00000-0000-4000-8000-000000000001', 'f6b00000-0000-4000-8000-00000000000b',
  'Yellow Yaks', 'YY', 'neutral');
select set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000004","role":"authenticated"}', true);
select public.create_team('f6b00000-0000-4000-8000-00000000000a', 'Xtreme XI', 'XXI');
reset role;
insert into public.tournament_teams (tournament_id, team_id)
values ('f6c00000-0000-4000-8000-000000000001', 'f6b00000-0000-4000-8000-00000000000a');
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f6c00000-0000-4000-8000-000000000001', 'f6a00000-0000-4000-8000-000000000002', 'moderator');
insert into public.invitations (kind, tournament_id, team_id, from_user, to_user, status, expires_at) values
  ('tournament_moderator', 'f6c00000-0000-4000-8000-000000000001', null, 'f6a00000-0000-4000-8000-000000000001',
   'f6a00000-0000-4000-8000-000000000003', 'pending', now() + interval '7 days'),
  ('team_owner', 'f6c00000-0000-4000-8000-000000000001', 'f6b00000-0000-4000-8000-00000000000b',
   'f6a00000-0000-4000-8000-000000000002', 'f6a00000-0000-4000-8000-000000000005', 'pending', now() + interval '7 days');
set local role authenticated;

-- a) Only the owner removes moderators: the stranger and a moderator removing someone else are 42501.
-- b) The owner cannot be removed (22023).
do $$
declare t uuid := 'f6c00000-0000-4000-8000-000000000001'; code text;
begin
  foreach code in array array['5', '2'] loop
    perform set_config('request.jwt.claims', format('{"sub":"f6a00000-0000-4000-8000-00000000000%s","role":"authenticated"}', code), true);
    declare got text;
    begin
      begin perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000003'); exception when others then got := sqlstate; end;
      if got is distinct from '42501' then raise exception 'FAIL a: account % gave %', code, got; end if;
    end;
  end loop;
  perform set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  code := null;
  begin perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000001'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL b: removing the owner gave %', code; end if;
end $$;

-- c) The owner withdraws the pending invite to 3 and removes moderator 2. 2's team owner request is cancelled and
--    2 is notified; a repeat is a no-op.
do $$
declare t uuid := 'f6c00000-0000-4000-8000-000000000001';
begin
  perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000003');
  perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000002');
  perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000002');
  reset role;
  if exists (select 1 from public.tournament_staff where tournament_id = t and user_id = 'f6a00000-0000-4000-8000-000000000002')
    or exists (select 1 from public.invitations where tournament_id = t and status = 'pending') then
    raise exception 'FAIL c: moderator still on staff or an invite still pending';
  end if;
  if (select count(*) from public.notifications where user_id = 'f6a00000-0000-4000-8000-000000000002'
        and data ->> 'event' = 'moderator_removed') <> 1
    or exists (select 1 from public.notifications where user_id = 'f6a00000-0000-4000-8000-000000000003' and kind = 'system') then
    raise exception 'FAIL c: wrong removal notifications';
  end if;
  set local role authenticated;
end $$;

-- d) A moderator may step down. e) Only the owner removes a team (42501 for a moderator).
reset role;
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f6c00000-0000-4000-8000-000000000001', 'f6a00000-0000-4000-8000-000000000002', 'moderator');
set local role authenticated;
do $$
declare t uuid := 'f6c00000-0000-4000-8000-000000000001'; code text;
begin
  perform set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000002","role":"authenticated"}', true);
  begin perform public.remove_tournament_team(t, 'f6b00000-0000-4000-8000-00000000000a'); exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL e: moderator removing a team gave %', code; end if;
  perform public.remove_tournament_moderator(t, 'f6a00000-0000-4000-8000-000000000002');
  if exists (select 1 from public.tournament_staff where tournament_id = t and user_id = 'f6a00000-0000-4000-8000-000000000002') then
    raise exception 'FAIL d: the moderator could not step down';
  end if;
end $$;

-- f) The owner removes both teams. X keeps existing and 4 is notified; ownerless Y is deleted. Repeats are no-ops.
do $$
declare t uuid := 'f6c00000-0000-4000-8000-000000000001';
begin
  perform set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  perform public.remove_tournament_team(t, 'f6b00000-0000-4000-8000-00000000000a');
  perform public.remove_tournament_team(t, 'f6b00000-0000-4000-8000-00000000000b');
  perform public.remove_tournament_team(t, 'f6b00000-0000-4000-8000-00000000000b');
  reset role;
  if exists (select 1 from public.tournament_teams where tournament_id = t) then raise exception 'FAIL f: a team is still entered'; end if;
  if not exists (select 1 from public.teams where id = 'f6b00000-0000-4000-8000-00000000000a')
    or exists (select 1 from public.teams where id = 'f6b00000-0000-4000-8000-00000000000b') then
    raise exception 'FAIL f: X must stay and Y must be deleted';
  end if;
  if (select count(*) from public.notifications where user_id = 'f6a00000-0000-4000-8000-000000000004'
        and data ->> 'event' = 'team_removed') <> 1 then
    raise exception 'FAIL f: the owner of X was not notified once';
  end if;
end $$;

rollback;

-- Nothing from this script persisted.
do $$
begin
  if exists (select 1 from auth.users where email like 'removal-test-%')
    or exists (select 1 from public.tournaments where id::text like 'f6c00000-0000-4000-8000-%')
    or exists (select 1 from public.teams where id::text like 'f6b00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'tournament removal verification passed';
end $$;
