# Friendly match and scoring handoff

This document records the work completed in this session and the remaining work for the next developer or agent. Read `AGENTS.md` and `memory.md` before changing code. The project is an Expo SDK 58 / React Native app with Expo Router and a pnpm lockfile.

## Current status

The Supabase project `es-sports` has the match, career statistics, team image and exclusive friendly scorer migrations applied. The app changes described below are in the working tree; they have not been committed, built or released by this session. Inspect `git status` and preserve all existing changes before editing. In particular, `src/features/matches/matches-screen.tsx` was already modified independently and should not be overwritten.

### Friendly match setup

- `src/features/match/friendly-setup-screen.tsx` builds two squads, runs the toss and saves the scheduled match, roster and scorer assignment to Supabase before opening scoring. An assigned scorer receives a shareable scorer link. The creator is routed to the spectator match view when someone else is assigned.
- Player search in `src/features/match/friendly/search-players.ts` reads public `profiles` from Supabase, excludes squad members and uses an abort signal. The search sheet for tournament rosters still uses its existing sample repository; the Supabase search change applies to friendly setup.
- Profile photo URLs from search and the signed-in user's profile are retained in the friendly setup and displayed in its squad rows. Guests and accounts without photos display initials. The 40 seeded fictional accounts have no profile photos.
- Team A and B can select, preview and remove a team image. The image is uploaded to the existing public `avatars` bucket under the creator's folder when the match is saved; match image URLs are stored in `matches.team_a_image_url` and `matches.team_b_image_url`. The UI no longer presents the blue, yellow and grey selectors. A match without an image uses the existing fallback.
- The per-player “Playing” badge was removed. When a squad has reserves, checkboxes allow the lineup to be changed.
- `src/features/match/components/saved-friendlies.tsx` lists up to 20 eligible scheduled or live friendlies for the current creator or assigned scorer, providing a route to reopen the scorer. A creator who delegated scoring does not receive a scorer entry for that match.

### Scorer authorization

The remote `friendly_exclusive_scorer` migration is applied. For a friendly match whose `fixture_ref` begins with `friendly-`:

1. If a scorer is assigned in `match_scorers`, only that scorer may write scoring events and update the match through the existing row-level-security policies.
2. If no scorer is assigned, the match creator may score.
3. A database trigger prevents assigning a second scorer. An authenticated creator cannot delete the assigned friendly scorer to regain scoring access. Non-friendly matches retain their previous permission rules.

`src/features/scoring/data/load-scorer.ts` calls the database's `can_score_match` function before opening a saved scorer session. This UI check is not the security boundary: the database policies are. The scorer assignment is currently fixed for a friendly; there is no user-facing reassignment or emergency handover flow. Administrative intervention is required if the assigned account is unavailable. Decide and implement an authorized handover flow before promising one to users.

### Recovery after an app close

Opening an eligible saved match loads its players and saved ball events and replays the event log into the scorer session. After reopening the app, the authorized scorer can go to Friendly Match Setup and choose the match under “Your saved matches”, or reopen the shared scorer link. This restores the **last successfully saved** state.

**Update (durable outbox):** scoring changes are now written to a per-account, per-match file (`src/features/scoring/data/outbox*.ts`) before they are sent, and removed only after Supabase accepts them. On the next run they are reconciled against the server and resent in order; a conflict with newer server scoring is reported instead of overwritten. Remaining limits: a match cannot be opened with no connection, and if the disk write itself fails the change is only held in memory. Device kill tests are still required.

`createMatch` saves the match, players and scorer in separate requests. A failure can leave a partial setup or uploaded images behind. The scorer loader detects a scheduled friendly with missing playing squads and refuses to open it, but this is not an atomic creation or cleanup mechanism. Consider a transactional server operation and idempotent recovery as part of the next reliability pass.

## Supabase details

- Remote project name: `es-sports`; project ref: `tedgyfczmqqnwrlucsoc`.
- Local migration files (renamed to match the remote history): `20261029181703_matches.sql`, `20261029181705_player_career_stats.sql`, `20261029192151_match_team_images.sql` and `20261029194934_friendly_exclusive_scorer.sql`.
- The remote history should list `20261029181703`, `20261029181705`, `20261029192151` and `20261029194934` (recorded by the MCP session; not re-checked since). The profile schema (`20261028000000_profiles.sql`) exists remotely but is not in the history. **Before any `supabase db push`:** `supabase link --project-ref tedgyfczmqqnwrlucsoc`, then `supabase migration repair --status applied 20261028000000`, then confirm `supabase migration list` shows local and remote matching.
- `supabase/seed_bengali_players.sql` was run against this project. It created 40 fictional, non-login player accounts: 20 batters, 5 all-rounders, 5 keepers and 10 bowlers. All have batting and bowling figures from two fictional matches. The script refuses to overwrite its existing fixture IDs.
- Career statistics are database views derived from completed, non-voided ball events. They are current when queried. Supabase Realtime publication was not enabled for these tables; the spectator live-match hook polls stored live matches every 15 seconds.

## Verification performed

- The exclusive scorer migration was applied successfully through the Supabase MCP on the `es-sports` project. Before applying it, the database had zero friendly matches with multiple scorer assignments.
- A rolled-back remote SQL integration check confirmed that the creator can score an unassigned friendly, an assigned scorer can insert a ball, the creator and an unrelated user cannot insert a ball after assignment, the creator cannot remove that assignment, and a second assignment is rejected. No verification match was committed. An initial attempt failed due to an ambiguous SQL test variable; the corrected check passed.
- `pnpm.cmd typecheck`: PASS after the migration was applied.
- `pnpm.cmd lint`: exit 0 with one pre-existing warning: unused `comingSoon` import in `src/features/team/team-members-screen.tsx`.
- `pnpm.cmd exec jest --runInBand src/features/match/__tests__/friendly-setup-screen.test.tsx src/features/match/__tests__/saved-friendlies.test.ts src/features/scoring/data/__tests__/staged-load.test.ts src/features/scoring/data/__tests__/scorer-sync.test.tsx src/features/scoring/__tests__/friendly-scoring.test.tsx`: PASS, 5 suites and 20 tests.
- An earlier full Jest run passed 67 suites and 392 tests before the latest scorer-permission work; the full suite was not rerun after those changes. No device or end-to-end app test was performed for this handoff.
- A local Supabase database was unavailable because Docker Desktop's daemon was not running. Remote SQL verification was used instead.

## Recommended next work

1. Design and implement a durable, account-scoped scoring outbox with ordered, idempotent writes. Restore pending operations on app restart, handle user/session changes safely, and test killing the app while offline, during an in-flight write, during undo and at match completion. Avoid overwriting newer server state or silently losing queued changes.
2. Make friendly setup, roster and scorer assignment atomic or implement a reliable resumable cleanup/retry workflow. Cover concurrent attempts and image uploads, including partial-failure cleanup.
3. Design an explicit, authorized scorer handover and recovery flow for an unavailable scorer. Preserve the user's requirement that only one scorer can write at a time, including during the transfer.
4. Run authenticated end-to-end tests on devices: creator selects another scorer, assigned scorer starts and scores, creator and third party are denied, force-close and reopen, save retries, guest and app player search, and team image uploads. Verify that share links and the actual released app work.
5. Reconcile migration history before future CLI pushes, then review and commit the intended working-tree changes. Release the app only with user authorization.

No secrets or account credentials belong in this document. Do not use the fixture accounts as real users.
