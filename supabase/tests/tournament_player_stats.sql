-- Verification for tournament_player_stats (top players). Run as an administrator; everything rolls back.
--
-- One finished league match, Alpha (A1, A2) v Bravo (B1, B2). Innings 1, A1 facing B1 with A2 at the other end:
--   4 | dot | wide (1) | 6 | bye (1) | A1 bowled
-- Innings 2, B1 facing A2 with B2 at the other end: 1 | B2 run out (0)
-- A second match on a cancelled fixture gives A1 100 more runs and must not count.
-- Expected:
--   A1 bat 10 off 5, 1 four, 1 six, out, high 10;     no bowling
--   A2 bat 0 off 0, not out (at the crease);          bowl 2 balls, 1 run, 0 wkts, 1 dot (run out is no wicket)
--   B1 bat 1 off 2, not out;                          bowl 5 balls, 11 runs (wide yes, bye no), 1 wkt, 2 dots, best 1/11
--   B2 bat 0 off 0, out (run out);                    no bowling, best null

begin;

insert into auth.users (id, instance_id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select ('fea00000-0000-4000-8000-00000000000' || n)::uuid, '00000000-0000-0000-0000-000000000000', 'authenticated',
  'authenticated', 'player-stats-test-' || n || '@example.invalid', '{"provider":"email","providers":[]}'::jsonb,
  jsonb_build_object('full_name', (array['A1', 'A2', 'B1', 'B2'])[n]), now(), now()
from generate_series(1, 4) n;
insert into public.profiles (id, full_name)
select id, raw_user_meta_data ->> 'full_name' from auth.users where email like 'player-stats-test-%'
on conflict (id) do update set full_name = excluded.full_name;

insert into public.tournaments (id, name, city, venue, start_date, end_date, match_format, competition, teams_planned,
  ball, side_format, players_per_side, min_squad, max_squad)
values ('fec00000-0000-4000-8000-000000000001', 'Stats Cup', 'Chattogram', 'Ground', current_date, current_date + 5,
  'T20', 'league', 4, 'Tennis', 'gully_6', 6, 6, 8);

insert into public.matches (id, tournament_id, fixture_ref, team_a_name, team_a_short, team_a_tone, team_b_name, team_b_short,
  team_b_tone, overs_limit, status)
select ('fed00000-0000-4000-8000-00000000000' || n)::uuid, 'fec00000-0000-4000-8000-000000000001', 'tournament-stats-' || n,
  'Alpha', 'ALP', 'neutral', 'Bravo', 'BRV', 'neutral', 20, 'live'
from generate_series(1, 2) n;
insert into public.match_players (match_id, key, side, name, profile_id, in_playing_xi, sort_order)
select m.id, p.id::text, case when p.full_name like 'A%' then 'a' else 'b' end, p.full_name, p.id, true, 0
from public.matches m cross join public.profiles p
where m.id::text like 'fed00000-%' and p.id::text like 'fea00000-%';

insert into public.ball_events (id, match_id, innings, kind, striker_key, non_striker_key, bowler_key, delivery_kind, runs,
  total_runs, is_legal, dismissal, out_key)
select gen_random_uuid(), 'fed00000-0000-4000-8000-000000000001', x.inn, 'delivery', x.s, x.ns, x.bw, x.kind, x.r, x.t, x.legal,
  x.dis, x.out
from (values
  (1, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'runs', 4, 4, true, null, null),
  (2, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'runs', 0, 0, true, null, null),
  (3, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'wide', 0, 1, false, null, null),
  (4, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'runs', 6, 6, true, null, null),
  (5, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'bye', 0, 1, true, null, null),
  (6, 1, 'fea00000-0000-4000-8000-000000000001', 'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'wicket', 0, 0, true, 'Bowled', 'fea00000-0000-4000-8000-000000000001'),
  (7, 2, 'fea00000-0000-4000-8000-000000000003', 'fea00000-0000-4000-8000-000000000004', 'fea00000-0000-4000-8000-000000000002', 'runs', 1, 1, true, null, null),
  (8, 2, 'fea00000-0000-4000-8000-000000000003', 'fea00000-0000-4000-8000-000000000004', 'fea00000-0000-4000-8000-000000000002', 'wicket', 0, 0, true, 'Run out', 'fea00000-0000-4000-8000-000000000004')
) as x(n, inn, s, ns, bw, kind, r, t, legal, dis, out)
order by x.n;
-- The cancelled fixture's match: A1 hits 100 that must not count.
insert into public.ball_events (id, match_id, innings, kind, striker_key, non_striker_key, bowler_key, delivery_kind, runs, total_runs, is_legal)
select gen_random_uuid(), 'fed00000-0000-4000-8000-000000000002', 1, 'delivery', 'fea00000-0000-4000-8000-000000000001',
  'fea00000-0000-4000-8000-000000000002', 'fea00000-0000-4000-8000-000000000003', 'runs', 5, 5, true
from generate_series(1, 20);

update public.matches set status = 'completed', completed_at = now(), winner_side = 'a', result_type = 'runs', result_margin = 9
where id::text like 'fed00000-%';
insert into public.tournament_fixtures (tournament_id, number, stage, round, home_label, away_label, match_date, start_min, match_id,
  status, cancel_reason, cancelled_at)
values
  ('fec00000-0000-4000-8000-000000000001', 1, 'League', 0, 'Alpha', 'Bravo', current_date, 540, 'fed00000-0000-4000-8000-000000000001', 'scheduled', null, null),
  ('fec00000-0000-4000-8000-000000000001', 2, 'League', 0, 'Alpha', 'Bravo', current_date + 1, 540, 'fed00000-0000-4000-8000-000000000002', 'cancelled', 'Rain', now());

do $$
declare got text;
begin
  if has_function_privilege('anon', 'public.tournament_player_stats(uuid)', 'execute')
    or not has_function_privilege('authenticated', 'public.tournament_player_stats(uuid)', 'execute') then
    raise exception 'FAIL grants: signed-in users only';
  end if;
  select string_agg(format('%s[%s] m%s i%s %s/%s 4s%s 6s%s out%s hi%s%s | b%s r%s w%s d%s best %s/%s',
      name, team_short, matches, innings, runs, balls_faced, fours, sixes, outs, coalesce(highest::text, '-'),
      case when highest_not_out then '*' else '' end, balls_bowled, runs_conceded, wickets, dots,
      coalesce(best_wickets::text, '-'), coalesce(best_runs::text, '-')), '; ' order by name)
    into got from public.tournament_player_stats('fec00000-0000-4000-8000-000000000001');
  if got is distinct from
    'A1[ALP] m1 i1 10/5 4s1 6s1 out1 hi10 | b0 r0 w0 d0 best -/-; '
    || 'A2[ALP] m1 i1 0/0 4s0 6s0 out0 hi0* | b2 r1 w0 d1 best 0/1; '
    || 'B1[BRV] m1 i1 1/2 4s0 6s0 out0 hi1* | b5 r11 w1 d2 best 1/11; '
    || 'B2[BRV] m1 i1 0/0 4s0 6s0 out1 hi0 | b0 r0 w0 d0 best -/-' then
    raise exception 'FAIL stats: %', got;
  end if;
end $$;

rollback;
