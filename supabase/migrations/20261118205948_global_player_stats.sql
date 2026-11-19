-- Global leaderboard: `tournament_player_stats` now also answers for every tournament at once.
--
-- * `p_tournament` null = every finished match of every tournament that is not deleted (friendlies never count, they
--   have no tournament). A tournament id behaves as before.
-- * New columns for the leaderboard's tie-breaks and context: `highest_balls` (balls faced in the highest innings, fewer
--   ranks higher), `highest_overs` / `best_overs` (the overs of the match where the best innings / figures came).
-- * Same counting rules as 20261103045751_tournament_player_stats.sql.
-- * shortcut: the global call reads every finished tournament match on each request; move it to a materialized view
--   refreshed on `save_match_result` when it gets slow.

drop function public.tournament_player_stats(uuid);

create function public.tournament_player_stats(p_tournament uuid default null)
returns table (
  profile_id uuid, name text, team_name text, team_short text, matches int, innings int, runs int, balls_faced int,
  fours int, sixes int, outs int, highest int, highest_not_out boolean, highest_balls int, highest_overs int,
  balls_bowled int, runs_conceded int, wickets int, dots int, best_wickets int, best_runs int, best_overs int
)
language sql stable security invoker set search_path = '' as $$
  with ms as (
    select m.id, m.team_a_name, m.team_a_short, m.team_b_name, m.team_b_short, m.completed_at, m.overs_limit
    from public.matches m
    join public.tournament_fixtures f on f.match_id = m.id and f.tournament_id = m.tournament_id and f.status = 'scheduled'
    join public.tournaments t on t.id = m.tournament_id
    where m.status = 'completed'
      and (case when p_tournament is null then t.deleted_at is null else m.tournament_id = p_tournament end)
  ), d as (
    select e.match_id, e.striker_key, e.non_striker_key, e.bowler_key, e.delivery_kind, e.runs, e.total_runs,
      e.is_legal, e.dismissal, e.out_key
    from public.ball_events e join ms on ms.id = e.match_id
    where e.voided_at is null and e.kind = 'delivery'
  ), bat as (
    select match_id, striker_key as key,
      sum(case when delivery_kind in ('runs', 'no-ball', 'wicket') then runs else 0 end)::int as runs,
      count(*) filter (where delivery_kind <> 'wide')::int as balls,
      count(*) filter (where delivery_kind in ('runs', 'no-ball') and runs = 4)::int as fours,
      count(*) filter (where delivery_kind in ('runs', 'no-ball') and runs = 6)::int as sixes
    from d group by match_id, striker_key
  ), crease as (
    select match_id, striker_key as key from d union select match_id, non_striker_key from d
  ), dismissed as (
    select match_id, out_key as key, count(*)::int as n
    from d where delivery_kind = 'wicket' and out_key is not null group by match_id, out_key
  ), bowl as (
    select match_id, bowler_key as key,
      count(*) filter (where is_legal)::int as balls,
      sum(case when delivery_kind in ('bye', 'leg-bye') then 0 else total_runs end)::int as runs,
      count(*) filter (where delivery_kind = 'wicket' and dismissal is distinct from 'Run out')::int as wickets,
      count(*) filter (where is_legal and coalesce(total_runs, 0) = 0)::int as dots
    from d group by match_id, bowler_key
  ), per_match as (
    select p.profile_id, ms.completed_at, ms.overs_limit,
      case p.side when 'a' then ms.team_a_name else ms.team_b_name end as team_name,
      case p.side when 'a' then ms.team_a_short else ms.team_b_short end as team_short,
      exists (select 1 from crease c where c.match_id = p.match_id and c.key = p.key) as batted,
      coalesce(b.runs, 0) as runs, coalesce(b.balls, 0) as balls, coalesce(b.fours, 0) as fours, coalesce(b.sixes, 0) as sixes,
      coalesce(o.n, 0) = 0 as not_out,
      coalesce(w.balls, 0) as balls_bowled, coalesce(w.runs, 0) as runs_conceded, coalesce(w.wickets, 0) as wickets,
      coalesce(w.dots, 0) as dots
    from public.match_players p
    join ms on ms.id = p.match_id
    left join bat b on b.match_id = p.match_id and b.key = p.key
    left join dismissed o on o.match_id = p.match_id and o.key = p.key
    left join bowl w on w.match_id = p.match_id and w.key = p.key
    where p.profile_id is not null and p.in_playing_xi
  )
  select pm.profile_id, coalesce(nullif(btrim(pr.full_name), ''), 'Player'),
    (array_agg(pm.team_name order by pm.completed_at desc))[1],
    (array_agg(pm.team_short order by pm.completed_at desc))[1],
    count(*)::int,
    count(*) filter (where pm.batted)::int,
    sum(pm.runs)::int, sum(pm.balls)::int, sum(pm.fours)::int, sum(pm.sixes)::int,
    count(*) filter (where pm.batted and not pm.not_out)::int,
    max(pm.runs) filter (where pm.batted),
    -- The highest innings is most runs, then fewest balls, then not out; all three columns read the same innings.
    (array_agg(pm.not_out order by pm.runs desc, pm.balls, pm.not_out desc) filter (where pm.batted))[1],
    (array_agg(pm.balls order by pm.runs desc, pm.balls, pm.not_out desc) filter (where pm.batted))[1],
    (array_agg(pm.overs_limit order by pm.runs desc, pm.balls, pm.not_out desc) filter (where pm.batted))[1],
    sum(pm.balls_bowled)::int, sum(pm.runs_conceded)::int, sum(pm.wickets)::int, sum(pm.dots)::int,
    (array_agg(pm.wickets order by pm.wickets desc, pm.runs_conceded) filter (where pm.balls_bowled > 0))[1],
    (array_agg(pm.runs_conceded order by pm.wickets desc, pm.runs_conceded) filter (where pm.balls_bowled > 0))[1],
    (array_agg(pm.overs_limit order by pm.wickets desc, pm.runs_conceded) filter (where pm.balls_bowled > 0))[1]
  from per_match pm
  join public.profiles pr on pr.id = pm.profile_id
  group by pm.profile_id, pr.full_name;
$$;

revoke all on function public.tournament_player_stats(uuid) from public, anon;
grant execute on function public.tournament_player_stats(uuid) to authenticated;
