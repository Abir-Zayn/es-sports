# Track A (Claude): roster, teams and squads

Branch `feat/tc-roster`, cut from `b138766`. Covers workfile items 2, 3, 5 and 6.

## Migrations (apply in this order, after review)

| File | Adds |
| --- | --- |
| `20261103000000_tournament_staff_team_removal.sql` | `remove_tournament_moderator`, `remove_tournament_team` |
| `20261103010000_team_member_availability.sql` | `team_members.availability` (available, injured, resting), `set_team_member_availability` |
| `20261103020000_tournament_squads.sql` | `tournament_squads` table, `set_tournament_squad` |

SQL checks to paste into the SQL editor after each one: `supabase/tests/tournament_removal.sql`,
`team_availability.sql`, `tournament_squads.sql`. They have **not been run** (no local database or Docker here).

`src/lib/database.types.ts` was edited by hand for the new columns, table and functions. Regenerate it after the
migrations are applied.

## What changed in the app

- Teams & staff screen (published tournaments): the owner can **remove a moderator** or withdraw a waiting invite,
  a moderator can **leave**, a declined moderator shows with **Re-invite**, and the owner can **disband a team**
  (it leaves the tournament; a team made there with no owner is deleted).
- Team members screen: a **Status** action marks a member available, injured or resting (owner or admin for
  anyone, a member for themself). The real team Members tab shows the status.
- `/tournament/squad` for a published tournament opens the **server squad screen**: the team owner or an admin picks
  the registered squad from the members (max `max_squad`, shows how many are short of `min_squad`, flags injured
  or resting players, blocks a player already in another team's squad). Every team row now has a Squad button.

## Notes for the merge with Track B (fixtures)

- `remove_tournament_team` does not yet check for fixtures. Once fixtures reference teams, it should refuse
  (or cancel the fixtures of) a team that has scheduled, live or completed matches.
- The playing XI for a fixture should be picked from `tournament_squads`, leaving out members whose
  `availability` is not `available`.
- `src/features/tournament/data/tournament-writes.ts` gained two functions; expect a small merge there if Track B
  also edits it.

## Not done

- Guest players (no account) in server squads. The in-memory squad screen still supports them for drafts.
- Registration close/reopen and roster lock on the server (still "not available" for published tournaments).
- The server does not cap moderators at 2; only the app does.
