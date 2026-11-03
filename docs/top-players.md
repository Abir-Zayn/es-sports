# Top players ranking (workfile item 12)

Built on `feat/tournament-top-players`, after the points table (PR #25).

## What the user sees

The **Stats** tab of a published tournament has a Batting / Bowling switch and four lists each. The top three go
on the podium and the rest of the top 20 are listed below. The lists refresh over Realtime when a match of the
tournament changes.

| Batting | Ranked by | Then | Second column |
| --- | --- | --- | --- |
| Most runs | runs | strike rate | SR |
| Highest score (`*` not out) | highest score | not out first | innings |
| Most sixes | sixes | runs | runs |
| Best SR (min 30 balls faced) | strike rate | runs | runs |

| Bowling | Ranked by | Then | Second column |
| --- | --- | --- | --- |
| Most wickets | wickets | economy | economy |
| Best figures | wickets in one match | fewest runs in it | economy |
| Economy (min 2 overs) | economy | wickets | wickets |
| Dot balls | dot balls | economy | economy |

Name breaks any remaining tie. A player with nothing to show in a list (no runs, no wickets, too few balls) is
left out of it.

## Where it lives

| Layer | File |
| --- | --- |
| Server | `supabase/migrations/20261103045751_tournament_player_stats.sql`: function `tournament_player_stats(p_tournament)`, security invoker, signed-in users only |
| Check | `supabase/tests/tournament_player_stats.sql` (passes on the live project, rolls back) |
| Ranking rules (pure) | `src/features/tournament/data/player-stats.ts` |
| Read | `src/features/tournament/data/player-stats-repository.ts` |
| Screen | `src/features/tournament/real/real-tournament-stats.tsx` |

## Counting rules

These are the same as the career stats (`player_match_figures`):
- Batter's runs leave out wides, byes and leg-byes, and balls faced leave out wides.
- Bowlers aren't charged byes or leg-byes, and a run out isn't a bowler's wicket.

Added for this feature:
- **Dot ball:** a legal delivery with no runs at all.
- **Best figures:** most wickets in one match, then fewest runs.

Only finished matches of fixtures that weren't cancelled count, at every stage (league and knockout).

## Why a function and not the career view

`player_match_figures` reads every finished match on the platform. Its CTEs are used more than once, so Postgres
builds all of them before any tournament filter applies. The function limits every step to the tournament's
own matches first.

## Later

- The Overview tab's "top performers" section still shows sample data for real tournaments. It can reuse
  `rankPlayers` (the first entry of Most runs and Most wickets).
- Fielding lists (catches, run outs) need the fielder recorded on every dismissal first.
