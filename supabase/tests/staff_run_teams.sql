-- Verification for staff-run teams (migration 20261110040000). Run as an administrator; rolled back.
-- Accounts: 1 owner, 2 moderator, 3 stranger, 4 and 5 players.
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('fa000000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'staffteams-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', 'Staffteams test ' || n), now(), now()
from generate_series(1, 5) n;
insert into public.profiles (id, full_name)
select id, 'Staffteams test' from auth.users where email like 'staffteams-test-%' on conflict (id) do nothing;

insert into public.tournaments (id, owner_id, name, city, venue, start_date, end_date, match_format, competition,
  teams_planned, ball, side_format, players_per_side, min_squad, max_squad)
values ('fab00000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001', 'Staffteams cup', 'Dhaka', 'Ground',
  current_date, current_date + 5, 'T10', 'league', 4, 'Tennis', 'tapeball_8', 8, 8, 12);
insert into public.tournament_staff (tournament_id, user_id, role) values
  ('fab00000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000001', 'owner'),
  ('fab00000-0000-4000-8000-000000000001', 'fa000000-0000-4000-8000-000000000002', 'moderator');

create function pg_temp.as_user(n int) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', 'fa000000-0000-4000-8000-00000000000' || n, 'role', 'authenticated')::text, true) $$;

do $$
declare
  t constant uuid := 'fab00000-0000-4000-8000-000000000001';
  team constant uuid := 'fac00000-0000-4000-8000-000000000001';
  u constant text := 'fa000000-0000-4000-8000-00000000000';
  inv uuid;
begin
  -- the owner creates a team; it has no owner row
  perform pg_temp.as_user(1);
  perform public.create_tournament_team(t, team, 'Staff Tigers', 'STG', 'blue');
  if exists (select 1 from public.team_members where team_id = team) then raise exception 'FAIL new team has members'; end if;

  -- staff count as the team's manager; a stranger does not
  if public.team_role(team) <> 'owner' then raise exception 'FAIL owner role'; end if;
  perform pg_temp.as_user(2);
  if public.team_role(team) <> 'owner' then raise exception 'FAIL moderator role'; end if;
  perform pg_temp.as_user(3);
  if public.team_role(team) is not null then raise exception 'FAIL stranger role'; end if;
  begin perform public.send_team_player_invite(team, (u || '4')::uuid); raise exception 'FAIL stranger invited'; exception when sqlstate '42501' then null; end;

  -- the moderator invites a player, who accepts
  perform pg_temp.as_user(2);
  inv := public.send_team_player_invite(team, (u || '4')::uuid);
  perform pg_temp.as_user(4);
  perform public.accept_invitation(inv);
  if (select role from public.team_members where team_id = team and profile_id = (u || '4')::uuid) <> 'player' then raise exception 'FAIL player not added'; end if;
  if public.team_role(team) <> 'player' then raise exception 'FAIL player role'; end if;

  -- a player cannot invite; staff set a player's availability, a player sets their own
  begin perform public.send_team_player_invite(team, (u || '5')::uuid); raise exception 'FAIL player invited'; exception when sqlstate '42501' then null; end;
  perform public.set_team_member_availability(team, (u || '4')::uuid, 'resting');
  perform pg_temp.as_user(1);
  perform public.set_team_member_availability(team, (u || '4')::uuid, 'available');
  perform public.set_tournament_squad(t, team, array[(u || '4')::uuid]);
  if (select count(*) from public.tournament_squads where team_id = team) <> 1 then raise exception 'FAIL squad'; end if;

  -- the owner role is gone for good
  if to_regprocedure('public.send_team_owner_invite(uuid,uuid,uuid)') is not null then raise exception 'FAIL owner invite still exists'; end if;
  if has_function_privilege('authenticated', 'public.create_team(uuid,text,text,text,text,text,text)', 'execute') then raise exception 'FAIL create_team still open'; end if;
  if has_function_privilege('authenticated', 'public.transfer_team_ownership(uuid,uuid)', 'execute') then raise exception 'FAIL transfer still open'; end if;
end $$;

rollback;
select 'PASS staff run teams' as result;
