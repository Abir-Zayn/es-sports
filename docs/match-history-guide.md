# Guide: tournament Match History (workfile item 10)

Written 2026-11-03, on top of PR #23 (`feat/tc-fixtures`). The knockout tree (item 9) is out of scope here.
Before writing code, read `AGENTS.md` and `memory.md`. The usual rules apply: files at most 200 lines (hard limit 270). Use the Reusable components.
writes go through `security definer` RPCs, report PASS / FAIL / NOT RUN, and finish with the section 11 report.

## 1. What "done" means

A signed-in user opens a published tournament, goes to **Matches → Results**, and sees every finished match: number
and stage, both teams with runs, wickets and overs, and the result line ("Alpha won by 12 runs"). Tapping one opens the
existing scorecard screens (`/match/[id]/scorecard`, `overs`, `info`). Live matches show under **Live now** and open
the live screen. Cancelled matches keep their Cancelled badge. All of it is real data, with no sample rows for a uuid
tournament.

## 2. Where things stand

| Piece | State |
| --- | --- |
| `tournament_fixtures` (number, stage, sides, date, time, cancel) | Live. `match_id uuid` column exists, always null today |
| Matches tab of a real tournament | Lists fixtures; tiles do not open anything (`openable={false}`) |
| Scoring (`matches`, `match_players`, `ball_events`, score head, outbox) | Live and solid, but only **friendlies** create matches |
| Spectator screens for a match uuid (live, scorecard, overs, wagon, info) | Real data, Realtime |
| `matches.tournament_id` | Column and index exist; **no foreign key**; nothing writes it |
| Squads, availability | Live (`tournament_squads`, `team_members.availability`) |
| Friendly-only rules | `friendly_single_scorer`, `offer_scorer_handover`/`accept`, `create_friendly_match` all check `fixture_ref like 'friendly-%'` |

**The gap:** nothing turns a fixture into a match, so there is no history to show. Phase 1 closes that; Phase 2 is
the history itself.

## 3. Decisions to make first

Each one has a default. Change it before you start, not halfway through.

| # | Question | Default |
| --- | --- | --- |
| D1 | Who may start a fixture's match? | Tournament owner or a moderator |
| D2 | Who scores it? | One scorer per match, picked when the match starts (any signed-in account); the starter can be the scorer |
| D3 | Where does each XI come from? | That team's `tournament_squads`, only members with `availability = 'available'`, exactly `players_per_side` each |
| D4 | Overs | From `match_format`: T10 → 10, T20 → 20, ODI → 50 |
| D5 | `fixture_ref` of the match | `tournament-<fixture uuid>`, so the scorer rules can tell tournament matches apart |
| D6 | A placeholder side ("Winner of Match 1") | Cannot start until both sides are real teams (needed for knockouts later) |
| D7 | Abandoned or no result | Out of scope; the owner cancels the fixture instead (only before it starts) |

## 4. Phase 1: start a fixture's match (the dependency)

### 4.1 Migration `<timestamp>_start_tournament_match.sql`

Add an FK first: `alter table matches add constraint matches_tournament_id_fkey foreign key (tournament_id) references
tournaments (id) on delete set null not valid;` then `validate constraint`. The column is already nullable and indexed.

`start_tournament_fixture(p_fixture uuid, p_scorer uuid, p_home_xi uuid[], p_away_xi uuid[]) returns uuid`
(security definer, `search_path = ''`):

1. Read the fixture. P0002 if missing. Then lock in the usual order: `begin_tournament_change(tournament_id)` must
   return owner or moderator (42501), then the fixture row `for update`.
2. **Idempotent:** if `match_id` is already set, return it. A retry after a lost reply then lands on the same match.
3. Refuse when: cancelled (22023); either side is a placeholder (ET007, new code: "both teams must be known");
   either XI is the wrong size, has duplicates, or has someone not in that team's squad or not `available` (22023);
   the scorer is not a profile (22023).
4. Insert into `matches`: new uuid, `tournament_id`, `fixture_ref = 'tournament-' || fixture id`, `created_by =
   auth.uid()`, title such as `Match 3 · Semi-final`, team names/shorts/tones from `teams`, `overs_limit` from D4,
   `scheduled_at` from `match_date + start_min`, `status = 'scheduled'`.
5. Insert `match_players`. Rows follow the shape `create_friendly_match` writes: `key`, `side` (`a`/`b`), `name`,
   `profile_id`, `in_playing_xi = true`, `sort_order`. Copy the key format from `src/features/scoring/data/match-rows.ts`
   so the scorer finds the players.
6. Insert `match_scorers (match_id, p_scorer)`, set `tournament_fixtures.match_id`, and notify the scorer (reuse the
   `notify_scorer_assigned` trigger if it fires for any match; check it).
7. Grants: authenticated only. Revoke from anon.

**Scorer rules for tournament matches.** Extend, do not copy, the friendly-only checks so `tournament-%` matches
also get them:
- `friendly_single_scorer` (one scorer per match) and the `match_scorers` insert policy.
- `offer_scorer_handover` / `accept_scorer_handover` (lines ~70 and ~124 of `20261101030000_scorer_handover.sql`).

Write each as `create or replace` in the new migration, changing `like 'friendly-%'` to
`(like 'friendly-%' or like 'tournament-%')`.

**Optional, for item 9 later:** when a knockout match completes, fill the next fixture's placeholder with the winner.
Leave a comment saying where it will go; do not build it now.

### 4.2 App

| File (new unless marked) | What |
| --- | --- |
| `src/features/tournament/fixture-match/start-fixture.ts` | `startFixtureMatch(fixtureId, scorerId, homeXi, awayXi)` RPC wrapper; error codes via `tournament-errors.ts` (add ET007) |
| `src/features/tournament/fixture-match/xi-picker-sheet.tsx` | Pick each XI from that team's squad (`fetchServerSquad`), injured/resting greyed out, count against `players_per_side` |
| `.../fixture-match/start-match-sheet.tsx` | Both XIs + scorer search (`UserSearchSheet`, `searchPlayers`) + Start |
| `schedule-builder/components/edit-match-sheet.tsx` (edit) | For staff, on a scheduled fixture with two real teams: **Start match** button |
| `real/real-tournament-matches.tsx` (edit) | Staff see Start on today's fixtures; started fixtures open the match |

After a successful start: the scorer goes to `/scorer/<match uuid>`; anyone else to `/match/<match uuid>`.
`findMatch` already opens a uuid, so the scorer screen should need no change. Confirm that `load-scorer.ts` does not
treat a non-friendly uuid differently (line ~35 only guards friendly refs).

### 4.3 Checks for Phase 1

- SQL test `supabase/tests/start_tournament_match.sql`, in the pattern of `tournament_fixtures.sql` (begin … rollback,
  `FAIL` messages): staff-only, idempotent retry, placeholder refused, XI size/squad/availability refused, cancelled
  refused, one scorer, fixture linked, a scorer handover works on a tournament match.
- Jest: RPC wrapper payload and errors, the XI picker rules, the Start button shown only to staff with two real teams.
- On a device: start a fixture, score a few balls as the scorer, see it live from a second account.

## 5. Phase 2: the Match History

### 5.1 Reading

Change `fetchServerSchedule` in `schedule-builder/schedule-server.ts` to embed the linked match in the same query
(no N+1):

```
match:matches!tournament_fixtures_match_id_fkey(id, status, team_a_runs, team_a_wickets, team_a_balls,
  team_b_runs, team_b_wickets, team_b_balls, overs_limit, winner_side, result_summary, completed_at)
```

Add to `ScheduledMatch`: `match?: { id; status: 'scheduled' | 'live' | 'completed'; score…; resultSummary }`.
Keep the 200-row limit; one tournament has at most 123 fixtures.

### 5.2 Showing

- `schedule-builder/to-fixture.ts`: `state` becomes `'live'` when `match.status = 'live'`, `'result'` when
  `completed`, else `'upcoming'`. Fill each side's `score` and `overs` the way `matchRowToFixture` in
  `src/features/matches/matches-repository.ts` does (reuse its `formatOvers`; do not copy it, export it). `note` is
  `result_summary` for a result. `buildSchedule` already groups Live now / Upcoming / Results.
- `real/real-tournament-matches.tsx`: tiles with a `match` open it (`useOpenMatch(match.id, state)`); tiles without
  one stay closed. Drop `openable={false}` and pass a per-fixture open rule instead (like `badgeFor`).
- **Live updates:** subscribe to `matches` changes for this tournament with Realtime (`tournament_id=eq.<id>`), the
  way `src/features/matches/use-realtime-matches.ts` does, and invalidate `scheduleKey(id)`. Clean up the channel on
  unmount. Check that `matches` is already in the Realtime publication (`20261101020000_realtime_match_tables.sql`).

### 5.3 Optional, small

- The team **Matches** tab (`/team/[id]/matches`) for a real team: the same fixtures filtered by
  `home_team_id`/`away_team_id`, newest result first. It still shows sample data.
- An empty state for Results: "No results yet. Finished matches appear here."

### 5.4 Checks for Phase 2

- Jest: `toFixture` maps scheduled, live and completed (scores, overs, result line); the Matches tab opens a started
  match and not an unstarted one; Results are listed newest first within each month.
- Realtime: a mocked channel update invalidates the schedule query, and unmount removes the channel.
- On a device: finish a match as the scorer; a second phone sees it move from Live now to Results without
  refreshing, then opens the scorecard.

## 6. Order of work and commits

1. Decisions D1 to D7 confirmed.
2. Migration and SQL test (Phase 1), applied to the live project, check passes, types regenerated. Commit.
3. Start-match UI and tests. Commit.
4. History read (embed) and `toFixture` states, with tests. Commit.
5. Realtime refresh, with tests. Commit.
6. Optional team Matches tab. Commit.
7. `npx tsc --noEmit`, `npx eslint src`, `npx jest`, the device run, then a PR to `main`.

## 7. Risks

- **Scorer rules drift.** Tournament matches must get the single-scorer and handover rules, or two people can score
  one match. Test this in SQL.
- **Squad changes after start.** The XI is copied into `match_players` at start, so later squad edits do not change a
  running match. That is intended; say so in the UI.
- **Removing a team.** `remove_tournament_team` refuses a team with *scheduled* fixtures, and a started fixture is still
  `scheduled` in `tournament_fixtures`, so this stays safe. Keep it that way, or also refuse when `match_id` is set.
- **Republishing.** `publish_tournament_schedule` already refuses once any fixture has a `match_id` (ET004).
- **Time zone.** `scheduled_at` is built from the ground's local date and time. Use the tournament's city time zone,
  or store it as local time and label it; do not let the server's UTC shift the day.
