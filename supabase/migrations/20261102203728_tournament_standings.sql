-- Tournament points table and net run rate (workfile item 11). Rules in docs/records-guide.md.
--
-- * A view, worked out on read from finished league matches, so there is nothing to keep in sync. One tournament
--   has at most ~120 fixtures, and the joins use existing indexes.
-- * Counts fixtures with stage 'League', still scheduled (not cancelled), whose linked match is completed.
-- * Home is side `a` of the match (start_tournament_fixture writes it that way).
-- * Points: win 2, tie 1, loss 0.
-- * Net run rate: runs scored per over faced minus runs conceded per over bowled, overs = balls / 6. A side bowled
--   out (wickets >= players per side - 1) is counted as having faced its full quota of overs.
-- * Every entered team is listed, with zeros before it plays. A team that left the tournament is not.
-- * security_invoker: the caller's own read rights apply; every table here is readable by signed-in users.

create view public.tournament_standings with (security_invoker = true) as
with results as (
  select f.tournament_id, f.home_team_id as team_id,
    m.team_a_runs as runs_for,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end as balls_for,
    m.team_b_runs as runs_against,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end as balls_against,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'a' then 'won' else 'lost' end as outcome
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.home_team_id is not null
  union all
  select f.tournament_id, f.away_team_id,
    m.team_b_runs,
    case when coalesce(m.team_b_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_b_balls end,
    m.team_a_runs,
    case when coalesce(m.team_a_wickets, 0) >= t.players_per_side - 1 then m.overs_limit * 6 else m.team_a_balls end,
    case when m.result_type = 'tie' then 'tied' when m.winner_side = 'b' then 'won' else 'lost' end
  from public.tournament_fixtures f
  join public.matches m on m.id = f.match_id
  join public.tournaments t on t.id = f.tournament_id
  where f.stage = 'League' and f.status = 'scheduled' and m.status = 'completed' and f.away_team_id is not null
), totals as (
  select tt.tournament_id, tt.team_id,
    count(r.outcome)::int as played,
    count(*) filter (where r.outcome = 'won')::int as won,
    count(*) filter (where r.outcome = 'lost')::int as lost,
    count(*) filter (where r.outcome = 'tied')::int as tied,
    coalesce(sum(r.runs_for), 0)::int as runs_for,
    coalesce(sum(r.balls_for), 0)::int as balls_for,
    coalesce(sum(r.runs_against), 0)::int as runs_against,
    coalesce(sum(r.balls_against), 0)::int as balls_against
  from public.tournament_teams tt
  left join results r on r.tournament_id = tt.tournament_id and r.team_id = tt.team_id
  group by tt.tournament_id, tt.team_id
)
select s.tournament_id, s.team_id, tm.name, tm.short_name, tm.tone,
  s.played, s.won, s.lost, s.tied, (s.won * 2 + s.tied) as points,
  s.runs_for, s.balls_for, s.runs_against, s.balls_against,
  case when s.balls_for > 0 and s.balls_against > 0
    then round(s.runs_for * 6.0 / s.balls_for - s.runs_against * 6.0 / s.balls_against, 3) end as nrr
from totals s
join public.teams tm on tm.id = s.team_id;

revoke all on public.tournament_standings from public, anon;
grant select on public.tournament_standings to authenticated;
