-- Verification for teams and team members (migration 20261102000000).
--
-- Run as an administrator (SQL editor) after the migration is applied. Paste this whole file, not the task
-- brief. Everything runs inside one transaction that is rolled back; the last block proves nothing was left
-- behind. Any failed assertion raises an exception that starts with FAIL.
--
-- Fixture accounts: 1 owner, 2 player, 3 admin, 4 staff, 5 not a member.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f4a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'teams-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Teams test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Teams test' from auth.users where email like 'teams-test-%' on conflict (id) do nothing;

do $$
begin
  if has_function_privilege('anon', 'public.create_team(uuid, text, text, text, text, text, text)', 'execute')
    or not has_function_privilege('authenticated', 'public.create_team(uuid, text, text, text, text, text, text)', 'execute')
    or has_function_privilege('authenticated', 'public.begin_team_change(uuid)', 'execute') then
    raise exception 'FAIL grants: create_team for authenticated only, begin_team_change for nobody';
  end if;
  if has_table_privilege('authenticated', 'public.team_members', 'insert')
    or has_table_privilege('authenticated', 'public.teams', 'insert')
    or has_column_privilege('authenticated', 'public.teams', 'created_by', 'update') then
    raise exception 'FAIL grants: direct inserts and created_by updates must be revoked';
  end if;
end $$;

select set_config('t.team', 'f4b00000-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"f4a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;

-- a) Create makes the caller owner. b) A repeat returns the id and adds nothing. c) Another account's repeat is 23505.
-- d) Invalid details are 22023 and write nothing.
do $$
declare t uuid := current_setting('t.team')::uuid; code text;
begin
  for i in 1..2 loop
    if public.create_team(t, ' Halishahar Strikers ', 'hss', 'blue') is distinct from t then
      raise exception 'FAIL a/b: call % returned another id', i;
    end if;
  end loop;
  if (select name || '/' || short_name from public.teams where id = t) <> 'Halishahar Strikers/HSS'
    or (select count(*) from public.team_members where team_id = t) <> 1
    or public.team_role(t) is distinct from 'owner' then
    raise exception 'FAIL a/b: wrong team or members';
  end if;
  begin
    perform public.create_team('f4b00000-0000-4000-8000-000000000002', 'Bad', 'TOOLONG');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '22023' or exists (select 1 from public.teams where id = 'f4b00000-0000-4000-8000-000000000002') then
    raise exception 'FAIL d: invalid details gave %', code;
  end if;
  perform set_config('request.jwt.claims', '{"sub":"f4a00000-0000-4000-8000-000000000005","role":"authenticated"}', true);
  code := null;
  begin
    perform public.create_team(t, 'Copy', 'CPY');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '23505' then raise exception 'FAIL c: reused id gave %', code; end if;
  code := null;
  begin
    insert into public.team_members (team_id, profile_id, role) values (t, 'f4a00000-0000-4000-8000-000000000005', 'admin');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL e: direct member insert gave %', code; end if;
end $$;

-- Members join through invitations (step 13); here the administrator adds them.
reset role;
insert into public.team_members (team_id, profile_id, role)
values (current_setting('t.team')::uuid, 'f4a00000-0000-4000-8000-000000000002', 'player'),
  (current_setting('t.team')::uuid, 'f4a00000-0000-4000-8000-000000000003', 'admin'),
  (current_setting('t.team')::uuid, 'f4a00000-0000-4000-8000-000000000004', 'staff');
set local role authenticated;

-- f) Only the owner changes roles. g) One captain, never staff; demoting the captain to staff clears it.
do $$
declare t uuid := current_setting('t.team')::uuid; code text;
  as_user text := '{"sub":"f4a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  begin
    perform public.set_team_member_role(t, 'f4a00000-0000-4000-8000-000000000002', 'admin');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL f: an admin changed a role (%)', code; end if;
  perform public.set_team_captain(t, 'f4a00000-0000-4000-8000-000000000002');
  perform public.set_team_captain(t, 'f4a00000-0000-4000-8000-000000000003');
  code := null;
  begin
    perform public.set_team_captain(t, 'f4a00000-0000-4000-8000-000000000004');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '22023'
    or (select array_agg(profile_id) from public.team_members where team_id = t and is_captain)
      <> array['f4a00000-0000-4000-8000-000000000003'::uuid] then
    raise exception 'FAIL g: captain rules (staff gave %)', code;
  end if;
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  perform public.set_team_member_role(t, 'f4a00000-0000-4000-8000-000000000003', 'staff');
  if exists (select 1 from public.team_members where team_id = t and is_captain) then
    raise exception 'FAIL g: a captain moved to staff kept the armband';
  end if;
  perform public.set_team_member_role(t, 'f4a00000-0000-4000-8000-000000000003', 'admin');
end $$;

-- h) Removing and leaving: an admin removes staff but not the owner; a player cannot remove an admin but can leave.
do $$
declare t uuid := current_setting('t.team')::uuid; code text;
  as_user text := '{"sub":"f4a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  begin
    perform public.remove_team_member(t, 'f4a00000-0000-4000-8000-000000000001');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '22023' then raise exception 'FAIL h: removing the owner gave %', code; end if;
  perform public.remove_team_member(t, 'f4a00000-0000-4000-8000-000000000004');
  perform set_config('request.jwt.claims', format(as_user, 2), true);
  code := null;
  begin
    perform public.remove_team_member(t, 'f4a00000-0000-4000-8000-000000000003');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL h: a player removed an admin (%)', code; end if;
  perform public.remove_team_member(t, 'f4a00000-0000-4000-8000-000000000002');
  if (select array_agg(profile_id order by profile_id) from public.team_members where team_id = t)
    <> array['f4a00000-0000-4000-8000-000000000001', 'f4a00000-0000-4000-8000-000000000003']::uuid[] then
    raise exception 'FAIL h: wrong members left';
  end if;
end $$;

-- i) Ownership transfer: only the owner; afterwards one owner and the old owner is an admin who may leave.
-- j) Team updates by owner and admins only, and never created_by. k) Only the owner deletes; members go with it.
-- l) Signed out is 42501.
do $$
declare t uuid := current_setting('t.team')::uuid; code text; n int;
  as_user text := '{"sub":"f4a00000-0000-4000-8000-00000000000%s","role":"authenticated"}';
begin
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  begin
    perform public.transfer_team_ownership(t, 'f4a00000-0000-4000-8000-000000000003');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL i: an admin took ownership (%)', code; end if;
  perform set_config('request.jwt.claims', format(as_user, 1), true);
  perform public.transfer_team_ownership(t, 'f4a00000-0000-4000-8000-000000000003');
  if (select string_agg(role, ',' order by profile_id) from public.team_members where team_id = t) <> 'admin,owner' then
    raise exception 'FAIL i: roles after transfer';
  end if;
  update public.teams set name = 'Strikers' where id = t;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL j: an admin could not rename the team'; end if;
  code := null;
  begin
    update public.teams set created_by = null where id = t;
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL j: created_by was writable (%)', code; end if;
  delete from public.teams where id = t;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL k: an admin deleted the team'; end if;
  perform public.remove_team_member(t, 'f4a00000-0000-4000-8000-000000000001');
  perform set_config('request.jwt.claims', format(as_user, 5), true);
  update public.teams set name = 'Taken' where id = t;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL j: a non-member renamed the team'; end if;
  perform set_config('request.jwt.claims', format(as_user, 3), true);
  delete from public.teams where id = t;
  if exists (select 1 from public.teams where id = t) or exists (select 1 from public.team_members where team_id = t) then
    raise exception 'FAIL k: the owner could not delete the team and its members';
  end if;
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  code := null;
  begin
    perform public.create_team('f4b00000-0000-4000-8000-000000000003', 'Nobody', 'NOB');
  exception when others then code := sqlstate;
  end;
  if code is distinct from '42501' then raise exception 'FAIL l: signed out gave %', code; end if;
end $$;

reset role;
rollback;

-- Nothing from this script persisted.
do $$
begin
  if exists (select 1 from auth.users where email like 'teams-test-%')
    or exists (select 1 from public.teams where id::text like 'f4b00000-0000-4000-8000-%') then
    raise exception 'FAIL cleanup: fixture rows persisted';
  end if;
  raise notice 'teams verification passed';
end $$;
