-- Verification for player availability (migration 20261103010000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file. Everything runs
-- inside one transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
--
-- Accounts: 1 owner of team X, 2 admin, 3 player, 4 staff member, 5 stranger.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f7a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'availability-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Availability test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Availability test' from auth.users where email like 'availability-test-%' on conflict (id) do nothing;

select set_config('request.jwt.claims', '{"sub":"f7a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_team('f7b00000-0000-4000-8000-000000000001', 'Avail XI', 'AXI');
reset role;
insert into public.team_members (team_id, profile_id, role) values
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000002', 'admin'),
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000003', 'player'),
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000004', 'staff');
set local role authenticated;

do $$
declare x uuid := 'f7b00000-0000-4000-8000-000000000001'; code text;
  claims text := '{"sub":"f7a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
  function_ok boolean;
begin
  function_ok := has_function_privilege('authenticated', 'public.set_team_member_availability(uuid, uuid, text)', 'execute')
    and not has_function_privilege('anon', 'public.set_team_member_availability(uuid, uuid, text)', 'execute');
  if not function_ok then raise exception 'FAIL grants: authenticated only'; end if;
  if (select availability from public.team_members where team_id = x and profile_id = 'f7a00000-0000-4000-8000-000000000003') <> 'available' then
    raise exception 'FAIL default: a member starts available';
  end if;

  -- a) The admin marks the player injured; the player marks themself resting.
  perform set_config('request.jwt.claims', format(claims, 2), true);
  perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000003', 'injured');
  if (select availability from public.team_members where team_id = x and profile_id = 'f7a00000-0000-4000-8000-000000000003') <> 'injured' then
    raise exception 'FAIL a: the admin could not mark the player injured';
  end if;
  perform set_config('request.jwt.claims', format(claims, 3), true);
  perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000003', 'resting');

  -- b) The player cannot change someone else's (42501); nor can a stranger.
  foreach code in array array['3', '5'] loop
    perform set_config('request.jwt.claims', format(claims, code), true);
    declare got text;
    begin
      begin perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000002', 'injured');
      exception when others then got := sqlstate; end;
      if got is distinct from '42501' then raise exception 'FAIL b: account % gave %', code, got; end if;
    end;
  end loop;

  -- c) A bad value and a staff member are 22023; a non-member target is P0002.
  perform set_config('request.jwt.claims', format(claims, 1), true);
  code := null;
  begin perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000003', 'away'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: bad value gave %', code; end if;
  code := null;
  begin perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000004', 'injured'); exception when others then code := sqlstate; end;
  if code is distinct from '22023' then raise exception 'FAIL c: staff gave %', code; end if;
  code := null;
  begin perform public.set_team_member_availability(x, 'f7a00000-0000-4000-8000-000000000005', 'injured'); exception when others then code := sqlstate; end;
  if code is distinct from 'P0002' then raise exception 'FAIL c: non-member gave %', code; end if;

  -- d) Direct writes stay revoked.
  code := null;
  begin update public.team_members set availability = 'injured' where team_id = x; exception when others then code := sqlstate; end;
  if code is distinct from '42501' then raise exception 'FAIL d: direct update gave %', code; end if;

  if (select availability from public.team_members where team_id = x and profile_id = 'f7a00000-0000-4000-8000-000000000003') <> 'resting' then
    raise exception 'FAIL: the player should be resting';
  end if;
end $$;

rollback;

do $$
begin
  if exists (select 1 from auth.users where email like 'availability-test-%')
    or exists (select 1 from public.teams where id::text like 'f7b00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'team availability verification passed';
end $$;
