# Next six work items

Plan for the next stretch of work on friendly matches and scoring. Read `AGENTS.md`, `memory.md` and `FRIENDLY_MATCH_HANDOFF.md` first.

## Where things stand

| Area | State |
| --- | --- |
| Friendly setup, player search, team images, saved friendlies | Done (`feat/friendly-match-scorer`, `d4a8d47`) |
| One assigned scorer per friendly, enforced by RLS | Done, migration applied on `es-sports` |
| Durable scoring outbox (scores survive app kill) | Done (`feat/durable-scoring-outbox`, `57aa58f`), unit tested; informal device check passed |
| APK with OTA updates on the `preview` channel | Released as `v1.0.0-preview.2` (EAS build `63229964`) |
| Feature branches merged to `main` | PR #5 open, waiting for merge |

## Recommended order

1. **Item 1:** merge and tidy. Everything else builds on a clean `main`.
2. **Item 2:** device-test what is already shipped before adding more.
3. **Item 3:** atomic friendly creation.
4. **Item 4:** server-side write ordering guard.
5. **Item 5:** scorer handover. It depends on item 4's guard.
6. **Item 6:** opening a match offline. It is the largest item, so it goes last.

---

## 1. Merge, migration history and release workflow — DONE except remote repair

**Why:** the new code and README link live only on feature branches. Local and remote migration versions differ, so `supabase db push` is unsafe.

**Scope**
- Open a PR from `feat/durable-scoring-outbox` (it contains `feat/friendly-match-scorer`) into `main`, review it and merge.
- Reconcile migration history. The four local files `20261029000000`, `20261030000000`, `20261031000000` and `20261101000000` match remote versions `20261029181703`, `20261029181705`, `20261029192151` and `20261029194934`. Either rename the local files to the remote versions or use `supabase migration repair`. The profile schema exists remotely but has no history entry.
- Fix the lint warning: unused `comingSoon` import in `src/features/team/team-members-screen.tsx`.
- Add a short "Shipping an OTA update" section to the README. It covers when OTA is allowed (JS only, same `version` in `app.json`), the command `npx eas-cli@latest update --channel preview`, and when a new APK is required (native module added, `version` changed).

**Status:** PR #5 open; local migration files renamed to the remote versions; lint clean; README has OTA steps. **Remaining:** link the CLI to `es-sports` and run `supabase migration repair --status applied 20261028000000`, then check `supabase migration list` (needs the account that owns `es-sports`).

**Done when**
- `main` holds all the work.
- `supabase migration list` shows local and remote in agreement.
- `pnpm lint` reports 0 warnings.
- The README documents the OTA steps.

---

## 2. Device verification of the shipped build — informal pass; record results

**Why:** nothing has been tested on a real phone yet. The outbox in particular is only unit tested.

**Scope:** install `v1.0.0-preview.2` on at least one low-end and one mid-range Android phone, then run the checklist below. Record pass or fail with notes in `docs/device-test-log.md`.

| # | Scenario | Expected |
| --- | --- | --- |
| 1 | Creator assigns another account as scorer | Creator lands on the spectator view; scorer receives the link |
| 2 | Assigned scorer opens the link and scores | Balls are saved and the spectator view updates within about 15 s |
| 3 | Creator and a third account try to score | Both are refused ("Only the assigned scorer…") |
| 4 | Score 3 balls offline, force-close, reopen online | All 3 balls reach the server in order |
| 5 | Force-close right after a ball while online | No duplicate or missing ball |
| 6 | Undo offline, force-close, reopen | The undone ball stays voided and later balls are correct |
| 7 | Finish the match offline, force-close, reopen | Match shows as completed with the right result |
| 8 | Score offline, sign out, sign in as another account | Nothing is sent; the first account's changes send after it signs back in |
| 9 | Same account scores on two phones | Second phone shows the conflict notice and **Discard unsent changes** works |
| 10 | Team image upload (JPEG, PNG, over 2 MB) | Under 2 MB uploads; over 2 MB shows an error |
| 11 | Guest player and app-account search | Both appear; photos or initials shown |
| 12 | Publish a trivial OTA update to `preview` | Phone picks it up after one or two restarts |

**Done when** every row is recorded. Each failure gets an issue or a fix.

---

## 3. Atomic friendly match creation

**Why:** `createMatch` writes the match, the players and the scorer in three separate requests, and team images are uploaded before that. A failure in the middle leaves a half-created match or orphan images in `avatars/<user>/friendly/<match>/`.

**Scope**
- Add a Postgres function `create_friendly_match(match jsonb, players jsonb, scorer uuid)`. It inserts all three in one transaction, is idempotent on `match.id` (a repeat call returns success), and its security model matches the existing RLS.
- Call it from `friendly-setup-screen.tsx` in place of `createMatch` for friendlies. Tournament matches keep the current path.
- Images: keep the stable upload paths (retries overwrite instead of piling up). Add cleanup that removes `avatars/<user>/friendly/<match>/*` when creation finally fails, and a pass that clears image folders older than a day with no matching `matches` row.
- Handle two attempts at once with the same match id (double tap, retry while the first call is still in flight).

**Done when**
- A forced failure at each step leaves either a complete match or nothing.
- A migration and an RPC test cover this (a rolled-back SQL check like the earlier scorer verification).
- The handoff doc is updated.

---

## 4. Server-side guard on write order

**Why:** the outbox checks for conflicts only when it resumes after a restart. During a session, a second device on the same account, or a scorer change (item 5), could interleave balls, and nothing on the server would stop it.

**Scope**
- Write scoring events through an RPC (or a trigger on `ball_events`) that takes the id of the latest live event the client expects (`expected_tail`). The write is rejected when the server's latest live event differs. This is optimistic concurrency, done in the database.
- Apply the same check to `void_events_from`, result and reopen.
- In `outbox.ts`, treat that rejection as `OutboxConflictError` (stop, keep the changes on the phone, show the existing discard notice) rather than retrying.
- Keep repeated sends safe. Re-sending an already-applied insert must still succeed.

**Done when**
- Two devices scoring at once cannot corrupt the event order, verified with an SQL test and an outbox unit test.
- Device row 9 shows the conflict during the session, not only after a restart.

---

## 5. Scorer handover and recovery

**Why:** a friendly's scorer can't be changed. If that person leaves or loses their phone, an admin has to fix it by hand.

**Product decisions needed before building**
- Who can start a handover: the current scorer only, or also the creator?
- If the current scorer is unreachable, can the creator take over after a timeout, and how long?
- What happens to the old scorer's unsent changes? Item 4 makes them conflict safely rather than overwrite.

**Scope**
- Add a `scorer_handover` record (`match_id`, `from_user`, `to_user`, `status: pending | accepted | cancelled | expired`, `expires_at`).
- Accepting is a single Postgres function. In one transaction it swaps the `match_scorers` row, so exactly one scorer can write at any moment. Relax the existing `friendly_single_scorer` trigger only inside that function.
- UI: "Hand over scoring" on the scorer screen, an accept or decline prompt for the new scorer (via share link, like the current assignment), and a status line for the creator.
- The old scorer's open session then fails its next write on RLS and shows "Scoring moved to <name>".

**Done when**
- At no point during a handover can two accounts write.
- SQL tests cover accept, decline, expiry and a race between two accepts.
- Device test: hand over in the middle of an over, with no lost or duplicate ball.

---

## 6. Opening and scoring a match offline

**Why:** unsent changes are now safe, but opening a match still needs the server (`findMatch`, `fetchEvents`). A scorer with no signal at the ground cannot continue after a restart.

**Scope**
- Keep a local snapshot per account and match: the match row, the players and the live events. Update it as the outbox sends.
- Opening a match: if the server can't be reached, open from the snapshot plus the outbox's unsent changes, show "Offline: changes will upload when connected", and keep the outbox running.
- **Storage decision:** the outbox files work well for unsent changes. For snapshots plus listing and querying saved matches offline, consider `expo-sqlite` (install with `npx expo install expo-sqlite`). It is a native module, so it **needs a new APK and cannot ship by OTA**. Decide here: either JSON snapshot files, which fit an OTA update, or SQLite in the next APK.
- Erase: delete the snapshot when the match is completed and fully sent, offer "Clear offline data" in Settings, and clear another account's snapshots on that account's sign-out once nothing is left unsent.

**Done when**
- Airplane mode, force-close and reopen opens the match and scoring continues.
- Back online, everything uploads in order.
- Device rows 4 to 8 are rerun offline from a cold start.

---

## Rules that apply to all items

- Files stay at or under 200 lines (hard limit 270).
- Run `pnpm typecheck`, `pnpm lint` (0 warnings) and the affected Jest suites before calling an item done.
- Native packages are installed only with `npx expo install`, which means a new APK, not OTA.
- Database changes ship as migrations with rolled-back SQL verification. Don't `supabase db push` until item 1's history reconciliation is done.
- Every item ends with the six-point report from `memory.md` section 11.
