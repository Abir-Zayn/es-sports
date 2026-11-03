# Track B (Codex): tournament fixtures, schedule and owner panel

Work on branch `feat/tc-fixtures` in the worktree `C:\office-work\esSports-tc-fixtures`. It was cut from `b138766`.
Track A (Claude) is working at the same time on `feat/tc-roster`, which covers roster, teams and squads. Stay out of its files (see "Ownership").

Read `AGENTS.md` and `memory.md` first and follow them. That means: files at most 200 lines (hard limit 270),
`select` only the columns you need, every mutation goes through a `security definer` RPC with role checks,
report each check as PASS / FAIL / NOT RUN, and end with the section 11 report.

## Goal (workfile items 7 and 8)

1. **Fixtures on the server.** Today `src/features/tournament/schedule-builder/schedule-repository.ts` keeps the
   schedule in memory. Replace that with tables and RPCs so a published schedule survives a restart and every
   team can see it.
2. **Auto or manual scheduling.** The owner picks a mode:
   - *Auto*: `generate.ts` draws the pairings and the slots. The owner can then change the date and time of any
     match before or after publishing.
   - *Manual*: the owner adds matches one at a time (pick two teams, a stage, a date and a time).
3. **Owner panel.** The tournament owner, and moderators if you think that is right (say which you chose in your
   report), can change a published match's date and time, or cancel the match with a reason.
   A match that is live or completed cannot be moved or cancelled.
4. The tournament Matches screen (`tournament-matches-screen.tsx`, `sections/schedule-group-section.tsx`) shows
   the real fixtures for a uuid tournament. The sample stays only for sample ids (the pattern is in
   `real/with-real-tournament.tsx`).

## Facts you can rely on

- `public.matches` already has `tournament_id uuid` (nullable, indexed), `fixture_ref text` and `scheduled_at timestamptz`.
  `status` is checked `in ('scheduled','live','completed')`, so **adding `'cancelled'` means changing that check**.
  Also check that `scoring_write_guard` and `score_head` still behave once a match is cancelled.
- `public.tournaments`, `public.tournament_staff` (roles `owner` and `moderator`, exactly one owner) and
  `public.tournament_teams` are in `20261102010000_tournaments.sql`. Use `public.begin_tournament_change(p_tournament)`:
  it locks the tournament row and returns the caller's staff role.
- Client and table types are in `src/lib/database.types.ts`. Errors from the API go through
  `src/features/tournament/data/tournament-errors.ts`.
- Choose for yourself whether a fixture is a `matches` row or sits in its own `tournament_fixtures` table that points
  to a match. Explain the choice in the migration header. Stage, round, match number, and "Winner of Match N"
  placeholders (`SideRef` in `schedule-builder/types.ts`) need to be stored, because the knockout tree (item 9) is
  built from them later.

## Ownership

| You may edit | Do not touch (Track A owns them) |
| --- | --- |
| `supabase/migrations/20261103100000_*` onwards (new files only) | `supabase/migrations/20261103000000`–`20261103099999` |
| `supabase/tests/fixtures*.sql` (new) | `src/features/tournament/roster/**`, `src/features/tournament/squad/**` |
| `src/features/tournament/schedule-builder/**` | `src/features/team/**`, `src/features/invitations/**` |
| `src/features/tournament/tournament-matches-screen.tsx`, `sections/schedule-group-section.tsx` | `src/app/team/**`, `src/app/tournament/squad.tsx`, `add-teams.tsx` |
| `src/app/tournament/schedule.tsx`, new owner-panel route(s) under `src/app/tournament/[id]/` | earlier migrations (never edit one that has been applied) |
| `src/features/tournament/data/**`: add files only; extending `tournament-errors.ts` is fine | |

`src/lib/database.types.ts` is shared. Regenerate it in your branch for your own work. When the branches merge it
is regenerated once from the merged migrations, so a conflict in that file is expected and fine.

## Rules

- Do not apply migrations to the remote Supabase project, and do not push or merge. Use the local database
  (`supabase db reset` / `supabase test db`) if it is available. Otherwise mark the SQL tests as NOT RUN.
- Commit only your own paths (`git add <paths>`, never `git add -A`).
- Before you report: `npx tsc --noEmit`, `npx expo lint`, `pnpm test` for the files you touched, and `supabase test db`.
