-- Verification for moderator duties and the limit of 2 (migration 20261110030000). Run as an administrator; rolled back.
-- Accounts: 1 owner, 2, 3 and 4 candidate moderators.
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f9a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'duties-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Duties test ' || n), now(), now()
from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, 'Duties test' from auth.users where email like 'duties-test-%' on conflict (id) do nothing;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
  teams_planned, ball, side_format, players_per_side, min_squad, max_squad)
values ('f9b00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000001', 'Duties cup', 'Dhaka', 'Ground',
  current_date, current_date + 5, 'T10', 'league', 4, 'Tennis', 'tapeball_8', 8, 8, 12);
insert into public.tournament_staff (tournament_id, user_id, role)
values ('f9b00000-0000-4000-8000-000000000001', 'f9a00000-0000-4000-8000-000000000001', 'owner');

create function pg_temp.as_user(n int) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', 'f9a00000-0000-4000-8000-00000000000' || n, 'role', 'authenticated')::text, true) $$;
create function pg_temp.duty(n int) returns text language sql as $$
  select can_stream || '/' || can_score from public.tournament_staff where tournament_id = 'f9b00000-0000-4000-8000-000000000001' and user_id = ('f9a00000-0000-4000-8000-00000000000' || n)::uuid $$;

do $$
declare
  t constant uuid := 'f9b00000-0000-4000-8000-000000000001';
  u2 constant uuid := 'f9a00000-0000-4000-8000-000000000002';
  u3 constant uuid := 'f9a00000-0000-4000-8000-000000000003';
begin
  if pg_temp.duty(1) <> 'false/false' then raise exception 'FAIL owner has duties'; end if;

  -- one moderator does both
  insert into public.tournament_staff (tournament_id, user_id, role) values (t, u2, 'moderator');
  if pg_temp.duty(2) <> 'true/true' then raise exception 'FAIL single moderator duties: %', pg_temp.duty(2); end if;

  -- two moderators: first streams, second scores
  insert into public.tournament_staff (tournament_id, user_id, role, added_at) values (t, u3, 'moderator', now() + interval '1 second');
  if pg_temp.duty(2) <> 'true/false' or pg_temp.duty(3) <> 'false/true' then raise exception 'FAIL two moderator duties: % %', pg_temp.duty(2), pg_temp.duty(3); end if;

  -- a third is refused, at insert and at invite
  begin insert into public.tournament_staff (tournament_id, user_id, role) values (t, 'f9a00000-0000-4000-8000-000000000004', 'moderator'); raise exception 'FAIL 3rd moderator'; exception when sqlstate 'ET008' then null; end;
  perform pg_temp.as_user(1);
  begin perform public.send_tournament_moderator_invite(t, 'f9a00000-0000-4000-8000-000000000004'); raise exception 'FAIL 3rd invite'; exception when sqlstate 'ET008' then null; end;

  -- only the owner assigns duties
  perform pg_temp.as_user(2);
  begin perform public.set_moderator_duties(t, u2, true, true); raise exception 'FAIL moderator set duties'; exception when sqlstate '42501' then null; end;

  -- the owner gives moderator 2 both duties; moderator 3 keeps scoring
  perform pg_temp.as_user(1);
  perform public.set_moderator_duties(t, u2, true, true);
  if pg_temp.duty(2) <> 'true/true' or pg_temp.duty(3) <> 'false/true' then raise exception 'FAIL both duties'; end if;

  -- a duty cannot be left uncovered, and the owner cannot be given duties
  begin perform public.set_moderator_duties(t, u2, false, false); perform public.set_moderator_duties(t, u3, false, false); raise exception 'FAIL uncovered'; exception when sqlstate '22023' then null; end;
  begin perform public.set_moderator_duties(t, 'f9a00000-0000-4000-8000-000000000001', true, true); raise exception 'FAIL owner duties'; exception when sqlstate '22023' then null; end;

  -- removing one moderator leaves the other doing both
  delete from public.tournament_staff where tournament_id = t and user_id = u3;
  if pg_temp.duty(2) <> 'true/true' then raise exception 'FAIL after removal: %', pg_temp.duty(2); end if;
end $$;

rollback;
select 'PASS moderator duties' as result;
