-- Verification for the points table (view tournament_standings). Run as an administrator; everything rolls back.
--
-- T20 (120 balls), 6 a side (all out at 5 wickets). Teams A, B, C, D; D has not played.
--   M1 League  A 150/4 (120)  v B 140/5 (100, all out -> 120)  A won by 10 runs
--   M2 League  C 121/2 (90)   v A 120/3 (120)                  C won by 4 wickets
--   M3 League  B 100/3 (120)  v C 100/4 (120)                  tie
--   M4 League  A v C, cancelled, with a finished match         must not count
--   M5 Final   A v B, finished                                 must not count
-- Expected: C 3 pts +0.814, A 2 pts -0.707, B 1 pt -0.250, D 0 pts, NRR null.

begin;

insert into public.tournaments (id, name, city, venue, start_date, end_date, match_format, competition, teams_planned,
  ball, side_format, players_per_side, min_squad, max_squad)
values ('fac00000-0000-4000-8000-000000000001', 'Table Cup', 'Chattogram', 'Ground', current_date, current_date + 5,
  'T20', 'league-knockout', 4, 'Tennis', 'gully_6', 6, 6, 8);
insert into public.teams (id, name, short_name) values
  ('fab00000-0000-4000-8000-00000000000a', 'Alpha', 'ALP'), ('fab00000-0000-4000-8000-00000000000b', 'Bravo', 'BRV'),
  ('fab00000-0000-4000-8000-00000000000c', 'Charlie', 'CHA'), ('fab00000-0000-4000-8000-00000000000d', 'Delta', 'DEL');
insert into public.tournament_teams (tournament_id, team_id)
select 'fac00000-0000-4000-8000-000000000001', id from public.teams where id::text like 'fab00000-%';

insert into public.matches (id, tournament_id, fixture_ref, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short,
  team_b_tone, overs_limit, status, completed_at, team_a_runs, team_a_wickets, team_a_balls, team_b_runs, team_b_wickets,
  team_b_balls, winner_side, result_type, result_margin)
values
  ('fad00000-0000-4000-8000-000000000001', 'fac00000-0000-4000-8000-000000000001', 'tournament-x1', 'Alpha', 'ALP', 'neutral',
   'Bravo', 'BRV', 'neutral', 20, 'completed', now(), 150, 4, 120, 140, 5, 100, 'a', 'runs', 10),
  ('fad00000-0000-4000-8000-000000000002', 'fac00000-0000-4000-8000-000000000001', 'tournament-x2', 'Charlie', 'CHA', 'neutral',
   'Alpha', 'ALP', 'neutral', 20, 'completed', now(), 121, 2, 90, 120, 3, 120, 'a', 'wickets', 4),
  ('fad00000-0000-4000-8000-000000000003', 'fac00000-0000-4000-8000-000000000001', 'tournament-x3', 'Bravo', 'BRV', 'neutral',
   'Charlie', 'CHA', 'neutral', 20, 'completed', now(), 100, 3, 120, 100, 4, 120, null, 'tie', null),
  ('fad00000-0000-4000-8000-000000000004', 'fac00000-0000-4000-8000-000000000001', 'tournament-x4', 'Alpha', 'ALP', 'neutral',
   'Charlie', 'CHA', 'neutral', 20, 'completed', now(), 200, 0, 120, 10, 5, 30, 'a', 'runs', 190),
  ('fad00000-0000-4000-8000-000000000005', 'fac00000-0000-4000-8000-000000000001', 'tournament-x5', 'Alpha', 'ALP', 'neutral',
   'Bravo', 'BRV', 'neutral', 20, 'completed', now(), 10, 5, 30, 200, 0, 120, 'b', 'runs', 190);

insert into public.tournament_fixtures (tournament_id, number, stage, round, home_team_id, away_team_id, match_date, start_min,
  match_id, status, cancel_reason, cancelled_at)
values
  ('fac00000-0000-4000-8000-000000000001', 1, 'League', 0, 'fab00000-0000-4000-8000-00000000000a', 'fab00000-0000-4000-8000-00000000000b',
   current_date, 540, 'fad00000-0000-4000-8000-000000000001', 'scheduled', null, null),
  ('fac00000-0000-4000-8000-000000000001', 2, 'League', 0, 'fab00000-0000-4000-8000-00000000000c', 'fab00000-0000-4000-8000-00000000000a',
   current_date + 1, 540, 'fad00000-0000-4000-8000-000000000002', 'scheduled', null, null),
  ('fac00000-0000-4000-8000-000000000001', 3, 'League', 0, 'fab00000-0000-4000-8000-00000000000b', 'fab00000-0000-4000-8000-00000000000c',
   current_date + 2, 540, 'fad00000-0000-4000-8000-000000000003', 'scheduled', null, null),
  ('fac00000-0000-4000-8000-000000000001', 4, 'League', 0, 'fab00000-0000-4000-8000-00000000000a', 'fab00000-0000-4000-8000-00000000000c',
   current_date + 3, 540, 'fad00000-0000-4000-8000-000000000004', 'cancelled', 'Rain', now()),
  ('fac00000-0000-4000-8000-000000000001', 5, 'Final', 1, 'fab00000-0000-4000-8000-00000000000a', 'fab00000-0000-4000-8000-00000000000b',
   current_date + 4, 540, 'fad00000-0000-4000-8000-000000000005', 'scheduled', null, null);

do $$
declare got text;
begin
  if has_table_privilege('anon', 'public.tournament_standings', 'select')
    or not has_table_privilege('authenticated', 'public.tournament_standings', 'select') then
    raise exception 'FAIL grants: signed-in users read, anon does not';
  end if;
  select string_agg(format('%s:%s/%s/%s/%s:%s:%s', short_name, played, won, lost, tied, points, coalesce(nrr::text, 'null')),
      ' ' order by points desc, nrr desc nulls last, won desc, name)
    into got from public.tournament_standings where tournament_id = 'fac00000-0000-4000-8000-000000000001';
  if got is distinct from 'CHA:2/1/0/1:3:0.814 ALP:2/1/1/0:2:-0.707 BRV:2/0/1/1:1:-0.250 DEL:0/0/0/0:0:null' then
    raise exception 'FAIL standings: %', got;
  end if;
  if (select balls_against from public.tournament_standings where team_id = 'fab00000-0000-4000-8000-00000000000a') <> 210 then
    raise exception 'FAIL all out: Bravo bowled out must count as 120 balls';
  end if;
end $$;

rollback;
