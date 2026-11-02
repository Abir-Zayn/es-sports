# Guide: tournament Records, the points table and net run rate (workfile item 11)

Written 2026-11-03 on branch `feat/tournament-records`, cut from `main` after PR #24 (Match History).
Out of scope: the knockout tree (item 9) and top players (item 12).
Follow `AGENTS.md` and `memory.md`: files at most 200 lines, writes only through RPCs, report PASS / FAIL / NOT RUN.

## 1. What "done" means

On a real (uuid) tournament, the **Table** tab shows one row per entered team: position, team, played, won, lost,
tied (the `NR` column), net run rate and points. It is worked out on the server from finished **league** matches
and updates when a match finishes, without a manual refresh. Qualifying places are marked. A knockout-only
tournament says it has no points table. No sample rows for a uuid tournament.

## 2. What already exists

| Piece | Where | State |
| --- | --- | --- |
| Points table UI | `components/points-table.tsx`, `PointsRow` in `src/types/cricket.ts` | Ready; fed sample rows |
| Sample screen | `tournament-table-screen.tsx` + `sample-table.ts` | Stays for sample ids |
| Real tournament screen | `real/real-tournament-screen.tsx`, section `table` | Shows "appear once matches are played" |
| Results | `tournament_fixtures.match_id` links `matches` (runs, wickets, balls, `winner_side`, `result_type`) | Live since PR #24 |
| Home is side `a` | `start_tournament_fixture` writes the home team as `team_a` | Relied on below |
| Realtime | `real/use-tournament-match-updates.ts` listens to `matches` for the tournament | Invalidates the schedule only |

## 3. Rules (decisions)

| # | Rule | Value |
| --- | --- | --- |
| R1 | Which matches count | Fixtures with `stage = 'League'`, not cancelled, whose match is `completed` |
| R2 | Points | Win 2, tie 1, loss 0. Abandoned / no result is not modelled yet, so it never occurs |
| R3 | Net run rate | (runs scored ÷ overs faced) − (runs conceded ÷ overs bowled), with overs as balls ÷ 6 |
| R4 | All out | A side bowled out (wickets ≥ players per side − 1) counts as having faced its full quota (`overs_limit × 6` balls), the standard rule |
| R5 | Order | Points, then NRR, then wins, then team name |
| R6 | NRR shown | Three decimals with a sign (`+1.245`, `-0.105`); `—` before a team has played |
| R7 | Qualifying | League + knockout: top 4 (semi-finals), or top 2 with fewer than 4 teams (final). League only: top 1 is champion. Knockout only: no table |
| R8 | A team that left | Not listed (the table follows `tournament_teams`) |

## 4. Server

Migration `<timestamp>_tournament_standings.sql`:

- View `public.tournament_standings` with `security_invoker = true`, so the callers' own read rights apply (all
  tables involved are readable by signed-in users). Columns: `tournament_id, team_id, name, short_name, tone, played,
  won, lost, tied, points, runs_for, balls_for, runs_against, balls_against, nrr`.
- Built from one row per team per match (home row from side `a`, away row from side `b`), unioned, then grouped;
  `left join` from `tournament_teams` so teams with no matches show zeros.
- `nrr` is `round(runs_for * 6.0 / balls_for - runs_against * 6.0 / balls_against, 3)`, null when either ball count is 0.
- Grants: `select` to authenticated, nothing to anon. Indexes already cover the joins
  (`tournament_fixtures (tournament_id, …)`, `tournament_fixtures (match_id)`, `matches` pk).

A view, not a table: nothing to keep in sync, and the cost is one tournament's fixtures (≤ 120 rows).

SQL check `supabase/tests/tournament_standings.sql` (begin … rollback): three teams; a win by runs, a win by wickets
in a chase, an all-out side, a tie, a cancelled fixture and a knockout match that must not count; then check points,
order and NRR to three decimals.

## 5. App

| File | Change |
| --- | --- |
| `data/standings-repository.ts` (new) | `fetchStandings(id)` → `PointsRow[]` (with positions), `standingsKey`, `formatNrr`, `qualifyRule(competition, teams)` |
| `real/real-tournament-table.tsx` (new) | Loading / error / empty states, `PointsTable`, the rules line |
| `real/real-tournament-screen.tsx` | Section `table` renders it |
| `real/use-tournament-match-updates.ts` | Also invalidate `standingsKey(id)` |

## 6. Checks

- Jest: `formatNrr` (+, −, zero, null), `qualifyRule`, row mapping and positions, the table screen states,
  realtime invalidating both keys.
- `npx tsc --noEmit`, `npx eslint src`, `npx jest`.
- SQL check on the live project (it rolls back).
- On a device: finish a league match and watch the table change on a second phone.

## 7. Later

- No result / abandoned matches (1 point each, NRR unchanged) once the scorer can end a match that way.
- Overview tab standings and the Teams tab positions still use sample data for real tournaments.
- Head-to-head and team records pages build on the same per-match rows.
