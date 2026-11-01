# Day plan: tournaments, team owners, invitations, notifications (5 hours)

Roadmap steps 11 (teams), 13 (invitations), 14 and 15-lite (tournaments, teams in a tournament) and 20-lite (notifications), cut down to one working slice. Integration branch: `feat/tournament-core`.

## For every agent: read this first

This file is the shared brief. Give the **whole file** to each agent and tell it only one thing: "You are **Job N**."

1. Read "Goal", "Decisions" and "Contract" (all binding), then **only your own Job section**. Ignore the other jobs.
2. Touch only the paths your job owns (the table below). If you need a change in someone else's paths, stop and say so in your report; do not edit them.
3. Do not run migrations against the remote project, do not push, do not merge. Commit only your own paths with `git add <those paths>` (never `git add -A` or `git add .`).
4. Follow `AGENTS.md` and `memory.md`: files at most 200 lines (hard 270), zero fabrication, report `PASS | FAIL | NOT RUN`, and end with the section 11 report.
5. If the contract is unclear or wrong, say so in the report with the line you would change. Do not silently invent a different name, column or error code: other agents are coding against the same names.

| Job | Model | Owns (may edit) | Must not touch |
| --- | --- | --- | --- |
| 1 | Opus 5.5 | `supabase/migrations/20261102010000_tournaments.sql`, `supabase/tests/tournaments.sql` | everything else |
| 2 | Argon 4 | `supabase/migrations/20261102020000_invitations_notifications.sql`, `supabase/tests/invitations.sql` | everything else |
| 3 | GPT 6.1 Terra | nothing (review only) | everything |
| 4 | Sonnet 5.5 | `src/features/team/**`, `src/features/tournament/**`, `src/app/team/**`, `src/app/tournament/**` | `supabase/`, `invitations/`, `notifications/` |
| 5 | Argon 4 or Sonnet 5.5 | `src/features/invitations/**`, `src/features/notifications/**`, `src/app/invitations.tsx`, `src/app/notifications.tsx` | `supabase/`, `team/`, `tournament/` |
| 6 | Gemini Flash 3.8 | `docs/**`, `NEXT_WORK.md` | all code |

**Working in parallel without clashes.** Several agents in one checkout share one git index and overwrite each other's files. Give each running job its own worktree, cut from `feat/tournament-core`:

```bash
git worktree add ../esSports-job1 -b job/tournaments feat/tournament-core
```

Use `job/invites` for Job 2, `job/app-tournament` for Job 4, `job/app-invites` for Job 5. The owner merges each job branch into `feat/tournament-core` as it finishes (jobs own different paths, so the merges are conflict-free; `database.types.ts` is regenerated once, after the migrations).

## Status

| Item | State |
| --- | --- |
| Step 6 (scorer handover) | **Done and committed** on `feat/scorer-handover-ui` (`efa69f5`, `4140cf2`). Migration applied and both SQL tests pass. Open: the two-session lock check and the device rows 13 to 15. |
| `feat/tournament-core` | **Created.** `feat/teams-backend` is merged in (`37733fd`). |
| Job 3 (GPT review of the teams migration) | **Not started.** Brief: "Job 3" below. Teams migration is not applied. |
| Jobs 1, 2, 6 | Ready to start now. |
| Jobs 4, 5 | Wait for the migrations to be applied and `database.types.ts` regenerated. Job 5's first task (the exports) can start at once. |

## Goal

Without sample data, on a phone:
1. A signed-in user **creates a team** and a **tournament** (saved on the server, not SecureStore).
2. The tournament organiser **adds a team** to the tournament.
3. The organiser sends a **team owner request** (the person becomes that team's owner) and a **tournament owner request** (the person joins the tournament staff). In the app these are the existing kinds `team-owner` and `tournament-moderator`.
4. The invited person sees a **notification**, opens it and **accepts or declines**. The organiser gets a notification of the answer.

Out of scope today: push notifications, squads and rosters, fixtures, scoring for tournament matches, points table, ownership of a whole tournament changing hands, cover image upload (stays local; the column exists and stays null).

## Decisions (change a value before the jobs start, not after)

| # | Decision | Default |
| --- | --- | --- |
| D1 | Who creates a tournament | Any signed-in user; they become its `owner`. |
| D2 | Staff roles | `owner` (one) and `moderator`. A moderator can add teams and send team owner requests. Only the owner sends moderator requests. |
| D3 | How a team enters a tournament | The organiser creates a new team inside the tournament (they own it at first), or adds a team they already own or administer. |
| D4 | Team owner request | The organiser must be the team's current owner. On accept, ownership moves to the invitee (the `transfer_team_ownership` rule: the old owner becomes an admin). |
| D5 | Invitation lifetime | 7 days. Lazy expiry, like the step 6 handover. One pending invitation per kind, tournament, team and person. |
| D6 | Notifications | Rows written only by server functions, in the same transaction as the event. Read own rows. Realtime on the table. In-app only. |
| D7 | Seat limit | A tournament holds at most `teams_planned` teams (4, 6, 8, 12 or 16). |
| D8 | Teams backend | Use `feat/teams-backend` as written (decisions D1 to D11 in `step-11-teams-backend.md`), after the GPT review. Changes only for a review blocker. |

## Clock (T = when the first job starts)

| Time | Owner | What |
| --- | --- | --- |
| T+0:00 to 0:20 | You | ~~Commit step 6. Create `feat/tournament-core`, merge `feat/teams-backend`.~~ **Done.** Next: start the GPT review of the teams migration, and start Job 1 and Job 2 at once (each in its own worktree). |
| T+0:20 to 1:40 | Opus, Argon, GPT, Flash | Job 1, Job 2, Job 3 (teams review), Job 6 run at the same time. |
| T+1:40 to 2:10 | Claude, you | I review both SQL diffs. You apply the migrations in order (teams, tournaments, invitations), run each SQL test, regenerate the types from Git Bash, commit. |
| T+2:10 to 4:00 | Sonnet, Argon | Job 4 and Job 5 run at the same time, in separate folders. |
| T+4:00 to 4:40 | Claude, GPT | I review the app diffs. GPT reviews Job 2's migration and the accept functions. One fix round. |
| T+4:40 to 5:00 | You | `pnpm typecheck`, `pnpm lint`, `pnpm test`, a phone or emulator smoke test, push, open the PR. |

**Cut line.** If the migrations are not applied by T+2:30, drop everything marked *should* below. The goal stays: create tournament, add team, one invitation kind end to end, a notification and accept.

| Must | Should | Later |
| --- | --- | --- |
| create team, create tournament, add a team, both request kinds, notification list, accept and decline, organiser's reply notification | unread badge, cancel a request, mark all read, edit tournament | cover images, remove a team, search users by phone, push |

## Contract (binding for every job)

Timestamps: Job 1 `20261102010000_tournaments.sql`, Job 2 `20261102020000_invitations_notifications.sql` (after the teams migration `20261102000000`). All functions are `security definer`, `set search_path = ''`, grant execute to `authenticated` only, sign-in check first, and take a per-row `for update` lock (the tournament, the team or the invitation) before they read state. Direct insert, update and delete on these tables are revoked from `authenticated`; select policies as listed. Same style, file size (at most 200 lines, hard 270) and rolled-back SQL test as steps 4 to 6.

### Tournaments (Job 1)

| Table | Columns |
| --- | --- |
| `tournaments` | `id` uuid pk (client-supplied), `owner_id`, `name` (3 to 80), `city`, `venue`, `start_date`, `end_date`, `match_format` (T10, T20, ODI), `competition` (league-knockout, league, knockout), `teams_planned` (4, 6, 8, 12, 16), `ball` (Tennis, Leather), `side_format`, `players_per_side`, `min_squad`, `max_squad`, `registration_opens`, `registration_deadline`, `cover_url` null, `profile_url` null, `created_at` |
| `tournament_staff` | pk `(tournament_id, user_id)`, `role` (`owner`, `moderator`), `added_at`. Exactly one `owner` per tournament (partial unique index). |
| `tournament_teams` | pk `(tournament_id, team_id)`, `added_by`, `added_at` |

Select: any signed-in user reads all three tables.

| Function | Rule |
| --- | --- |
| `create_tournament(p jsonb) returns uuid` | Idempotent on `p.id` (same owner: return it; another owner: `23505`). Validates like `draft.ts` (`validateDraft`). Inserts the owner row. |
| `create_tournament_team(p_tournament uuid, p_team uuid, p_name text, p_short_name text, p_tone text)` | Caller is staff. Creates the team (caller is owner) and the link in one transaction. Idempotent on `p_team`. `ET01` when full. |
| `add_tournament_team(p_tournament uuid, p_team uuid)` | Caller is staff and owner or admin of the team. Repeat returns OK. `ET01` when full. |

### Invitations and notifications (Job 2)

| Table | Columns |
| --- | --- |
| `invitations` | `id`, `kind` (`tournament_moderator`, `team_owner`), `tournament_id`, `team_id` null (required for `team_owner`), `from_user`, `to_user`, `status` (`pending`, `accepted`, `declined`, `cancelled`, `expired`), `expires_at`, `created_at`, `resolved_at`. Checks: `from_user <> to_user`; `(status = 'pending') = (resolved_at is null)`. Partial unique index on pending `(kind, tournament_id, coalesce(team_id, zero uuid), to_user)`. Select: sender and recipient only. |
| `notifications` | `id`, `user_id`, `kind` (`invite`, `invite_response`, `system`), `title`, `message`, `data jsonb` (`invitation_id`, `tournament_id`, `team_id`, `status`), `read_at` null, `created_at`. Select: own rows. In the `supabase_realtime` publication. |

| Function | Rule |
| --- | --- |
| `send_tournament_moderator_invite(p_tournament, p_to) returns uuid` | Caller is the tournament owner. Recipient has a profile and is not already staff. Writes the invite and a `invite` notification to the recipient. |
| `send_team_owner_invite(p_tournament, p_team, p_to) returns uuid` | Caller is staff and the team's current owner; the team is in the tournament. Same notification. `EI03` when the caller is not the team owner. |
| `accept_invitation(p_id)` | Recipient only. Lazy expiry. moderator: insert the staff row. team_owner: lock the team row (`for update`, as `begin_team_change` does), re-check the sender is still the owner (`EI03`, else), insert the recipient into `team_members` as `admin` if they are not a member yet (no add-member function exists; this is the only way in, D7), then do the swap **inline**: set the old owner to `admin` first (the one-owner partial index), then the recipient to `owner`. **Do not call `transfer_team_ownership`**: it requires the caller (`auth.uid()`, here the recipient) to be the current owner and the target to be a member, so it would raise `42501` or `P0002`. Writes an `invite_response` notification to the sender, marks the recipient's invite notification read. Repeat on `accepted` returns OK. |
| `decline_invitation(p_id)` | Recipient only. Same notifications. Repeat on `declined` returns OK. |
| `cancel_invitation(p_id)` | *Should.* Sender only. |
| `mark_notifications_read(p_ids uuid[])` | Own rows only; null marks all. |

Error codes: `42501` not allowed, `22023` invalid, `ET01` tournament full, `EI01` invitation not open, `EI02` already pending, `EI03` the sender no longer owns the team. As in step 6, a raise rolls back that call's earlier updates: the client treats `pending` as open only when `expires_at > now()`.

### Client exports (Job 5 writes them first, in the first 15 minutes, so Job 4 can import them)

`src/features/invitations/index.ts` exports `sendTeamOwnerInvite(tournamentId, teamId, toUserId)`, `sendModeratorInvite(tournamentId, toUserId)`, `acceptInvitation(id)` and `declineInvitation(id)`. Each returns a promise and throws `InvitationError` with a plain message.

---

## Job 1: tournaments migration and test

**Model:** Claude Opus 5.5 · **Size:** L · **Depends on:** the teams migration (merged into the branch)

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo.
BRANCH: feat/tournament-core.
READ FIRST: AGENTS.md, memory.md, docs/tasks/day-plan-tournament-invites.md (the "Contract" is binding),
  supabase/migrations/20261102000000_teams.sql (create_team, team_role, transfer_team_ownership),
  supabase/tests/teams.sql, src/features/tournament/create/draft.ts (validateDraft rules).
TASK
1. supabase/migrations/20261102010000_tournaments.sql: the three tables and three functions in the
   contract. Reuse the team creation logic of create_team through a shared internal function, do not copy it.
2. supabase/tests/tournaments.sql: rolled-back script, `raise exception 'FAIL ...'`, final select. Cover:
   create and repeat; a reused id from another account; invalid fields; direct writes refused; a non-staff
   caller refused on both team functions; create_tournament_team atomic (team, owner member, link) and
   idempotent; add_tournament_team by a team admin and refused for a plain player; ET01 at the seat limit;
   exactly one owner row.
DO NOT apply anything to the remote project. DO NOT edit app code or database.types.ts.
OUTPUT: the memory.md section 11 report. Say what you could not run.
```

## Job 2: invitations and notifications migration and test

**Model:** Argon 4 · **Size:** L · **Depends on:** the contract only (it can be written before Job 1 lands; it is applied after)

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo.
BRANCH: feat/tournament-core.
READ FIRST: AGENTS.md, memory.md, docs/tasks/day-plan-tournament-invites.md (the "Contract" is binding),
  supabase/migrations/20261101030000_scorer_handover.sql (lazy expiry, lock order, idempotent repeats, style),
  supabase/migrations/20261102000000_teams.sql (transfer_team_ownership).
TASK
1. supabase/migrations/20261102020000_invitations_notifications.sql per the contract. Table and function
   names for tournaments, tournament_staff and tournament_teams come from the contract; write against them.
2. supabase/tests/invitations.sql: rolled-back script. It creates its fixtures through the Job 1 functions.
   Cover: send by owner and by moderator (moderator invite refused for a moderator); the notification row
   for the recipient; accept moderator adds staff; accept team_owner moves ownership and the old owner
   becomes admin; the sender no longer owns the team at accept: EI03; decline; expiry; a second pending
   invite: EI02; a stranger cannot accept, read or cancel (42501 / no rows); repeat accept returns OK;
   the response notification to the sender; mark_notifications_read touches only own rows; direct writes
   refused.
DO NOT apply anything to the remote project. DO NOT edit app code or database.types.ts.
OUTPUT: the memory.md section 11 report. Say what you could not run.
```

## Job 3: review of the teams migration (start now)

**Model:** GPT 6.1 Terra · **Size:** review · **Depends on:** nothing

Use the review brief inside `docs/tasks/step-11-teams-backend.md` ("Job 3") and add two checks: (6) the SQL test must fail when behaviour is wrong (watch NULL conditions, the step 6 test passed on NULL), and (7) `transfer_team_ownership` must be safe to call from another security-definer function (Job 2's accept), with one owner always existing. Findings that are blockers go to Job 1's owner (Opus) before T+1:40.

## Job 4: tournament and team screens on real data

**Model:** Claude Sonnet 5.5 · **Size:** M · **Depends on:** migrations applied, types regenerated

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/tournament-core (you own src/features/team/** and src/features/tournament/**).
READ FIRST: AGENTS.md, memory.md, the "Goal" and "Contract" in docs/tasks/day-plan-tournament-invites.md,
  docs/tasks/step-11-teams-backend.md (Job 2 brief), src/features/tournament/create/*, roster/add-teams-screen.tsx.
TASK
1. Team: data/team-repository.ts (createTeam, fetchTeam, fetchMyTeams, fetchTeamMembers) and a create-team screen.
2. Tournament: data/tournament-repository.ts (createTournament via create_tournament, fetchTournament,
   fetchMyTournaments, fetchTournamentTeams). The create screen publishes to the server with a client uuid;
   local drafts stay in SecureStore until published. Overview and teams screens read the real tournament
   when the route id is a uuid; sample ids keep the sample, and a real id never shows the sample.
3. Add team: roster/add-teams-screen uses create_tournament_team (new team) or add_tournament_team (own team).
4. Invite buttons ("Invite owner" on a team, "Invite moderator" on the tournament) call sendTeamOwnerInvite and
   sendModeratorInvite from '@/features/invitations'. Until Job 5 lands, import from a stub with that
   signature and swap it later.
5. Jest tests for repositories and screens. Files at most 200 lines. Zero-crash render rules.
DO NOT touch supabase/, src/features/invitations/** or src/features/notifications/**.
OUTPUT: typecheck, lint, test: PASS | FAIL | NOT RUN, and the memory.md section 11 report.
```

## Job 5: invitations and notifications on real data

**Model:** Argon 4 (or Claude Sonnet 5.5 if Argon is busy) · **Size:** M · **Depends on:** migrations applied, types regenerated; the exports can start at once

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/tournament-core (you own src/features/invitations/** and src/features/notifications/**).
READ FIRST: AGENTS.md, memory.md, the "Contract" and "Client exports" in docs/tasks/day-plan-tournament-invites.md,
  src/features/invitations/*, src/features/notifications/*, src/features/scoring/handover/ (a finished example
  of repository, error mapping and isOpen).
TASK
1. FIRST (15 minutes): src/features/invitations/index.ts with the four exports from "Client exports" and
   InvitationError. Push it so Job 4 can import it.
2. Invitations repository on the server (replace the in-memory stand-in and the roster-store link), list
   screen, accept and decline with plain error messages for EI01, EI02, EI03, 42501.
3. Notifications: replace notifications-store and sample-notifications with a query on `notifications` plus
   one Realtime channel for the signed-in user (reuse the step 5 channel pattern). Invite notifications
   show Accept and Decline in the list and in the detail; `invite_response` shows the answer. Opening a row
   marks it read through mark_notifications_read.
4. Jest tests for the repository, the error mapping and the screens. Files at most 200 lines. Zero-crash rules.
DO NOT touch supabase/, src/features/team/** or src/features/tournament/**.
OUTPUT: typecheck, lint, test: PASS | FAIL | NOT RUN, and the memory.md section 11 report.
```

## Job 6: docs and housekeeping

**Model:** Gemini Flash 3.8 · **Size:** S · **Depends on:** nothing

```text
ROLE: Technical writer on the esSports repo.
TASK: (1) docs/ROADMAP.md: set the status for 2026-11-02, mark steps 11, 13, 14, 15-lite and 20-lite "in
  progress on feat/tournament-core" with a link to docs/tasks/day-plan-tournament-invites.md. (2) docs/device-test-log.md:
  add NOT RUN rows for: create a tournament; add a team; send a team owner request and accept it on a
  second account; send a moderator request and decline it; the notification appears without a refresh.
  (3) List the sample-* files that no code imports after this work (do not delete them).
Do not change code. Do not invent results.
```

---

## Review plan

1. **Claude** reviews each SQL diff against the contract (lock order, who may do what, atomic accept, the notification written in the same transaction) before the migrations are applied, and each app diff for the "never the sample in place of a real record" rule and render safety.
2. **GPT 6.1 Terra** reviews the invitation migration at T+4:00: can anyone become owner or staff without accepting, can a stale invite give ownership, can a user read someone else's invitation or notification.
3. One fix round, one re-check. Minors go to the roadmap's deferred list.

## Owner's steps

1. ~~Commit step 6; create `feat/tournament-core`; merge `feat/teams-backend`.~~ Done.
2. Apply migrations in order with the same method used for step 6 (`db query -f` plus `migration repair`, or `db push --include-all`), run each SQL test, then regenerate `src/lib/database.types.ts` from Git Bash.
3. Phone test with two accounts at the end.
