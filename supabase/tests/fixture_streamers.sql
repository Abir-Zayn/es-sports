-- Verification for fixture streamers (migration 20261110020000). Run as an administrator; rolled back at the end.
-- Accounts: 1 owner, 2 and 3 moderators, 4 stranger (not staff).
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f7a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'streamer-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Streamer test ' || n), now(), now()
from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, 'Streamer test' from auth.users where email like 'streamer-test-%' on conflict (id) do nothing;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
  teams_planned, ball, side_format, players_per_side, min_squad, max_squad)
values ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000001', 'Streamer cup', 'Dhaka', 'Ground',
  current_date, current_date + 5, 'T10', 'league', 4, 'Tennis', 'tapeball_8', 8, 8, 12);
insert into public.tournament_staff (tournament_id, user_id, role) values
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000001', 'owner'),
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000002', 'moderator'),
  ('f7b00000-0000-4000-8000-000000000001', 'f7a00000-0000-4000-8000-000000000003', 'moderator');
insert into public.tournament_fixtures (id, tournament_id, number, stage, round, home_label, away_label, match_date, start_min)
values ('f7c00000-0000-4000-8000-000000000001', 'f7b00000-0000-4000-8000-000000000001', 1, 'League', 0, 'Home', 'Away', current_date, 600);

create function pg_temp.as_user(n int) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', 'f7a00000-0000-4000-8000-00000000000' || n, 'role', 'authenticated')::text, true) $$;

do $$
declare
  f constant uuid := 'f7c00000-0000-4000-8000-000000000001';
  u2 constant uuid := 'f7a00000-0000-4000-8000-000000000002';
  u3 constant uuid := 'f7a00000-0000-4000-8000-000000000003';
  u1 constant uuid := 'f7a00000-0000-4000-8000-000000000001';
  m uuid := gen_random_uuid();
begin
  -- the owner assigns moderator 2
  perform pg_temp.as_user(1);
  perform public.assign_fixture_streamer(f, u2);
  if (select streamer_id from public.fixture_streamers where fixture_id = f) <> u2 then raise exception 'FAIL assign'; end if;
  if not exists (select 1 from public.notifications where user_id = u2 and data ->> 'event' = 'streamer_assigned') then raise exception 'FAIL notice'; end if;

  -- the owner cannot assign themself or a stranger (only moderators stream)
  begin perform public.assign_fixture_streamer(f, u1); raise exception 'FAIL owner as streamer'; exception when sqlstate '22023' then null; end;
  begin perform public.assign_fixture_streamer(f, 'f7a00000-0000-4000-8000-000000000004'); raise exception 'FAIL stranger as streamer'; exception when sqlstate '22023' then null; end;

  -- moderator 3 cannot take a match moderator 2 holds, nor assign someone else
  perform pg_temp.as_user(3);
  begin perform public.assign_fixture_streamer(f, u3); raise exception 'FAIL stole the match'; exception when sqlstate '42501' then null; end;
  begin perform public.assign_fixture_streamer(f, u2); raise exception 'FAIL moderator assigned another'; exception when sqlstate '42501' then null; end;

  -- a stranger cannot do anything
  perform pg_temp.as_user(4);
  begin perform public.assign_fixture_streamer(f, u2); raise exception 'FAIL stranger assigned'; exception when sqlstate '42501' then null; end;

  -- going live: only the streamer, and only after the match started
  perform pg_temp.as_user(3);
  begin perform public.set_fixture_broadcast_state(f, 'live'); raise exception 'FAIL wrong streamer went live'; exception when sqlstate '42501' then null; end;
  perform pg_temp.as_user(2);
  begin perform public.set_fixture_broadcast_state(f, 'live'); raise exception 'FAIL live before match'; exception when sqlstate 'ET011' then null; end;
  insert into public.matches (id, tournament_id, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short, team_b_tone)
  values (m, 'f7b00000-0000-4000-8000-000000000001', 'A', 'AAA', 'blue', 'B', 'BBB', 'yellow');
  update public.tournament_fixtures set match_id = m where id = f;
  perform public.set_fixture_broadcast_state(f, 'live');
  perform public.set_fixture_broadcast_state(f, 'live'); -- repeat is fine
  if (select state from public.fixture_streamers where fixture_id = f) <> 'live' or (select live_at from public.fixture_streamers where fixture_id = f) is null then
    raise exception 'FAIL live state';
  end if;

  -- once live nobody can reassign or clear
  perform pg_temp.as_user(1);
  begin perform public.assign_fixture_streamer(f, u3); raise exception 'FAIL reassigned while live'; exception when sqlstate 'ET010' then null; end;
  begin perform public.clear_fixture_streamer(f); raise exception 'FAIL cleared while live'; exception when sqlstate 'ET010' then null; end;

  -- end it; it cannot go live again
  perform pg_temp.as_user(2);
  perform public.set_fixture_broadcast_state(f, 'ended');
  begin perform public.set_fixture_broadcast_state(f, 'live'); raise exception 'FAIL live after end'; exception when sqlstate 'ET010' then null; end;
  if (select ended_at from public.fixture_streamers where fixture_id = f) is null then raise exception 'FAIL ended_at'; end if;

  -- removing the moderator from the tournament drops nothing that is ended; but an assigned one disappears
  delete from public.fixture_streamers where fixture_id = f;
  perform pg_temp.as_user(3);
  perform public.assign_fixture_streamer(f, u3); -- a moderator takes an unassigned match
  delete from public.tournament_staff where tournament_id = 'f7b00000-0000-4000-8000-000000000001' and user_id = u3;
  if exists (select 1 from public.fixture_streamers where fixture_id = f) then raise exception 'FAIL assignment survived removal'; end if;
end $$;

rollback;
select 'PASS fixture streamers' as result;
