-- Verification for the 3-moderator cap (migration 20261110000000).
--
-- Run as an administrator (SQL editor) after the moderator_cap migration is applied. Everything runs inside one
-- transaction that is rolled back. Any failed assertion raises an exception that starts with FAIL.
-- Fixture accounts: 1 owner, 2-5 candidate moderators.

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f6a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'modcap-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Modcap test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Modcap test' from auth.users where email like 'modcap-test-%' on conflict (id) do nothing;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
  teams_planned, ball, side_format, players_per_side, min_squad, max_squad)
values ('f6b00000-0000-4000-8000-000000000001', 'f6a00000-0000-4000-8000-000000000001', 'Modcap cup', 'Dhaka', 'Ground',
  current_date + 10, current_date + 20, 'T10', 'league', 4, 'Tennis', 'tapeball_8', 8, 8, 12);
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f6b00000-0000-4000-8000-000000000001', 'f6a00000-0000-4000-8000-000000000001', 'owner');

do $$
declare
  t constant uuid := 'f6b00000-0000-4000-8000-000000000001';
  n int;
begin
  -- three moderators are allowed
  for n in 2..4 loop
    insert into public.tournament_staff (tournament_id, user_id, role)
    values (t, ('f6a00000-0000-4000-8000-00000000000' || n)::uuid, 'moderator');
  end loop;

  -- the fourth is refused with ET008
  begin
    insert into public.tournament_staff (tournament_id, user_id, role)
    values (t, 'f6a00000-0000-4000-8000-000000000005', 'moderator');
    raise exception 'FAIL cap: a 4th moderator was inserted';
  exception when sqlstate 'ET008' then null;
  end;

  -- the owner row is not counted against the cap (an owner insert is still the one-owner index's business)
  if (select count(*) from public.tournament_staff where tournament_id = t and role = 'moderator') <> 3 then
    raise exception 'FAIL cap: expected exactly 3 moderators';
  end if;

  -- invite path: the owner is refused early once 3 moderators exist
  perform set_config('request.jwt.claims', '{"sub":"f6a00000-0000-4000-8000-000000000001","role":"authenticated"}', true);
  begin
    perform public.send_tournament_moderator_invite(t, 'f6a00000-0000-4000-8000-000000000005');
    raise exception 'FAIL invite: a 4th moderator invitation was sent';
  exception when sqlstate 'ET008' then null;
  end;
end $$;

rollback;
select 'PASS moderator cap' as result;
