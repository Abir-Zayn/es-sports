-- Career statistics on the server, read straight from the ball-by-ball log.
--
-- * Only completed matches count, and only events that were not undone (`voided_at is null`).
-- * A player counts towards a career when their `match_players.profile_id` links them to an account; guests
--   (no profile) keep their figures with the match only.
-- * The rules match the scorer (`src/features/scoring/engine/score-delivery.ts`): a no-ball is faced but a wide
--   is not; byes and leg byes are not the bowler's runs; a run out is not the bowler's wicket. A batter has
--   batted once they appear at either end in a delivery, so a not-out who never faced still counts.
-- * Maidens are not derived here yet; the app works them out per over while scoring.
-- * Views run with the caller's rights (security_invoker), so the read policies on the tables still apply.

create view public.player_match_figures with (security_invoker = true) as
with deliveries as (
  select e.*
  from public.ball_events e
  join public.matches m on m.id = e.match_id
  where m.status = 'completed' and e.voided_at is null and e.kind = 'delivery'
),
batting as (
  select match_id, striker_key as key,
    sum(case when delivery_kind in ('runs', 'no-ball', 'wicket') then runs else 0 end) as runs,
    count(*) filter (where delivery_kind <> 'wide') as balls_faced,
    count(*) filter (where delivery_kind in ('runs', 'no-ball') and runs = 4) as fours,
    count(*) filter (where delivery_kind in ('runs', 'no-ball') and runs = 6) as sixes
  from deliveries
  group by match_id, striker_key
),
at_crease as (
  select match_id, striker_key as key from deliveries
  union
  select match_id, non_striker_key from deliveries
),
dismissals as (
  select match_id, out_key as key, count(*) as outs
  from deliveries
  where delivery_kind = 'wicket' and out_key is not null
  group by match_id, out_key
),
bowling as (
  select match_id, bowler_key as key,
    count(*) filter (where is_legal) as balls_bowled,
    sum(case when delivery_kind in ('bye', 'leg-bye') then 0 else total_runs end) as runs_conceded,
    count(*) filter (where delivery_kind = 'wicket' and dismissal <> 'Run out') as wickets
  from deliveries
  group by match_id, bowler_key
)
select
  p.profile_id,
  p.match_id,
  p.key,
  m.completed_at,
  exists (select 1 from at_crease c where c.match_id = p.match_id and c.key = p.key) as batted,
  coalesce(b.runs, 0)::integer as runs,
  coalesce(b.balls_faced, 0)::integer as balls_faced,
  coalesce(b.fours, 0)::integer as fours,
  coalesce(b.sixes, 0)::integer as sixes,
  coalesce(d.outs, 0) = 0 as not_out,
  coalesce(w.balls_bowled, 0)::integer as balls_bowled,
  coalesce(w.runs_conceded, 0)::integer as runs_conceded,
  coalesce(w.wickets, 0)::integer as wickets
from public.match_players p
join public.matches m on m.id = p.match_id and m.status = 'completed'
left join batting b on b.match_id = p.match_id and b.key = p.key
left join dismissals d on d.match_id = p.match_id and d.key = p.key
left join bowling w on w.match_id = p.match_id and w.key = p.key
where p.profile_id is not null and p.in_playing_xi;

-- One row per account: the headline figures a profile shows.
create view public.player_career_stats with (security_invoker = true) as
select
  profile_id,
  count(*)::integer as matches,
  count(*) filter (where batted)::integer as innings,
  count(*) filter (where batted and not_out)::integer as not_outs,
  sum(runs)::integer as runs,
  sum(balls_faced)::integer as balls_faced,
  sum(fours)::integer as fours,
  sum(sixes)::integer as sixes,
  max(runs) filter (where batted) as highest,
  -- A not-out wins a tie for the highest score.
  (array_agg(not_out order by runs desc, not_out desc) filter (where batted))[1] as highest_not_out,
  round(sum(runs)::numeric / nullif(count(*) filter (where batted and not not_out), 0), 1) as batting_average,
  sum(wickets)::integer as wickets,
  sum(balls_bowled)::integer as balls_bowled,
  sum(runs_conceded)::integer as runs_conceded
from public.player_match_figures
group by profile_id;

revoke all on public.player_match_figures, public.player_career_stats from anon;
grant select on public.player_match_figures, public.player_career_stats to authenticated;
