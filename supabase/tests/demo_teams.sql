-- Verification for demo teams (migration 20261110010000). Run as an administrator; rolled back at the end.
-- Accounts: 1 owner, 2 moderator (not allowed), 3 stranger.
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('f8a00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'demo-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Demo test ' || n), now(), now()
from generate_series(1, 3) n;
insert into public.profiles (id, full_name)
select id, 'Demo test' from auth.users where email like 'demo-test-%' on conflict (id) do nothing;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
  teams_planned, ball, side_format, players_per_side, min_squad, max_squad)
values ('f8b00000-0000-4000-8000-000000000001', 'f8a00000-0000-4000-8000-000000000001', 'Demo cup', 'Dhaka', 'Ground',
  current_date, current_date + 5, 'T10', 'league', 4, 'Tennis', 'gully_6', 6, 6, 10);
insert into public.tournament_staff (tournament_id, user_id, role) values
  ('f8b00000-0000-4000-8000-000000000001', 'f8a00000-0000-4000-8000-000000000001', 'owner'),
  ('f8b00000-0000-4000-8000-000000000001', 'f8a00000-0000-4000-8000-000000000002', 'moderator');

create function pg_temp.as_user(n int) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', 'f8a00000-0000-4000-8000-00000000000' || n, 'role', 'authenticated')::text, true) $$;

do $$
declare
  t constant uuid := 'f8b00000-0000-4000-8000-000000000001';
  v_made int;
  v_users_before int := (select count(*) from auth.users);
begin
  perform pg_temp.as_user(1);
  -- off by default
  begin perform public.seed_demo_teams(t); raise exception 'FAIL seeded while switched off'; exception when sqlstate 'ET009' then null; end;
  update public.app_flags set enabled = true where key = 'demo_data';

  -- only the owner
  perform pg_temp.as_user(2);
  begin perform public.seed_demo_teams(t); raise exception 'FAIL moderator seeded'; exception when sqlstate '42501' then null; end;
  perform pg_temp.as_user(3);
  begin perform public.seed_demo_teams(t); raise exception 'FAIL stranger seeded'; exception when sqlstate '42501' then null; end;

  -- the owner fills the seats: 4 teams, 6 players each, all registered in the squad
  perform pg_temp.as_user(1);
  v_made := public.seed_demo_teams(t, 3);
  if v_made <> 3 then raise exception 'FAIL expected 3 teams, got %', v_made; end if;
  v_made := public.seed_demo_teams(t);
  if v_made <> 1 then raise exception 'FAIL expected the last seat, got %', v_made; end if;
  if public.seed_demo_teams(t) <> 0 then raise exception 'FAIL seeded past the seats'; end if;
  if (select count(*) from public.tournament_teams where tournament_id = t) <> 4 then raise exception 'FAIL team count'; end if;
  if (select count(*) from public.tournament_squads where tournament_id = t) <> 24 then raise exception 'FAIL squad rows'; end if;
  if (select count(distinct name) from public.teams x join public.tournament_teams tt on tt.team_id = x.id where tt.tournament_id = t) <> 4 then raise exception 'FAIL names'; end if;
  if exists (select 1 from public.team_members m join public.tournament_teams tt on tt.team_id = m.team_id
              where tt.tournament_id = t and m.role = 'owner' and m.profile_id <> 'f8a00000-0000-4000-8000-000000000001') then
    raise exception 'FAIL the owner should own every demo team';
  end if;

  -- the squads are good enough to start a match from: first 6 players of each side, the owner scores
  declare
    v_home uuid; v_away uuid; v_fixture uuid := gen_random_uuid(); v_match uuid;
    v_home_xi uuid[]; v_away_xi uuid[];
  begin
    select (array_agg(team_id order by added_at))[1], (array_agg(team_id order by added_at))[2] into v_home, v_away
      from public.tournament_teams where tournament_id = t;
    insert into public.tournament_fixtures (id, tournament_id, number, stage, round, home_team_id, away_team_id, match_date, start_min)
    values (v_fixture, t, 1, 'League', 0, v_home, v_away, current_date, 600);
    select array_agg(profile_id) into v_home_xi from (select profile_id from public.tournament_squads where tournament_id = t and team_id = v_home limit 6) x;
    select array_agg(profile_id) into v_away_xi from (select profile_id from public.tournament_squads where tournament_id = t and team_id = v_away limit 6) x;
    v_match := public.start_tournament_fixture(v_fixture, 'f8a00000-0000-4000-8000-000000000001', v_home_xi, v_away_xi);
    if v_match is null or (select count(*) from public.match_players where match_id = v_match) <> 12 then raise exception 'FAIL starting a demo match'; end if;
    -- a scheduled fixture blocks clearing; drop it so the cleanup below can run
    update public.tournament_fixtures set match_id = null where id = v_fixture;
    delete from public.tournament_fixtures where id = v_fixture;
  end;

  -- cleaning up removes teams and the demo accounts
  if public.clear_demo_teams(t) <> 4 then raise exception 'FAIL clear count'; end if;
  if exists (select 1 from public.tournament_teams where tournament_id = t) then raise exception 'FAIL teams left'; end if;
  if (select count(*) from auth.users) <> v_users_before then raise exception 'FAIL demo accounts left behind'; end if;
end $$;

rollback;
select 'PASS demo teams' as result;
