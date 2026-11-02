# Track B: tournament fixtures, schedule and owner panel

Branch `feat/tc-fixtures`, built on top of Track A (`feat/tc-roster`, `2f31571`). Covers workfile items 7 and 8.
Codex was assigned this track but never started it; Claude built it.

## Migrations (apply after Track A's three, in this order)

| File | Adds |
| --- | --- |
| `20261103100000_tournament_fixtures.sql` | `tournament_fixtures` table, schedule columns on `tournaments` (`schedule_mode`, `slots_per_day`, `first_start_min`, `schedule_published_at`), the schedule check and notification helpers |
| `20261103110000_tournament_schedule_writes.sql` | `publish_tournament_schedule`, `reschedule_tournament_fixture`, `cancel_tournament_fixture`; `remove_tournament_team` now refuses a team with scheduled fixtures |

SQL check: `supabase/tests/tournament_fixtures.sql` (paste into the SQL editor). **Not run**: no local database here.
`src/lib/database.types.ts` was edited by hand; regenerate it after applying.

### Design choices

- Fixtures have their own table, not `matches` rows: a knockout fixture may not know its teams yet ("Winner of
  Match 9"), and `matches` needs both team names. `match_id` links the fixture once scoring starts (roadmap step 17),
  so `matches`, the scoring guard and the score head are untouched.
- Times are a date plus minutes after midnight, as the builder already used, so no time zone can shift a match.
- Only the tournament owner changes the schedule (moderators see it read-only), matching the app's `manageSchedule`.
- The server re-checks the whole schedule on every write: tournament days, finished by 11 PM, one match on the
  ground at a time, no team twice a day.

## What changed in the app

- **Auto or manual.** The schedule screen has an Auto draw / Manual switch. Auto draws from the teams and settings and
  any match can then be moved. Manual adds matches one by one (two teams, stage, day, time), with the same clash rules.
- **Published tournaments.** Teams & staff shows the Schedule section for real tournaments too, and the schedule
  screen reads and saves through the server (`?tournamentId=<uuid>`). Drafts stay in memory as before.
- **Owner panel.** After publishing, tapping a match moves it or cancels it with a reason, at once, and both team
  owners are notified. Redraw and Publish changes replace the schedule until a match has started (then the server
  refuses with ET004 and only single-match changes remain).
- **Matches tab.** A real tournament's Matches tab lists the published fixtures by Live, Upcoming and Results, with a
  Cancelled badge; the owner gets Create or Change schedule.

## Error codes added to the app

ET004 match started, ET005 team still has scheduled matches, ET006 schedule clash.

## Not done

- Starting a fixture's match for scoring and linking `match_id` (roadmap step 17); fixture tiles do not open a match
  page until then.
- Restoring a cancelled match (cancel is final; redraw or add a new match instead).
- Knockout tree, match history, records and rankings (items 9 to 12) need played fixtures first.
