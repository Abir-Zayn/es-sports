# Step 3: atomic friendly match creation

Roadmap step 3 / NEXT_WORK item 3. Branch: `feat/atomic-friendly-create` (from `main` at `8e1ad7d`).

## Problem

`friendly-setup-screen.tsx` uploads team images, then calls `createMatch` (`src/features/scoring/data/match-repository.ts`). That makes three separate requests: upsert `matches`, then `match_players`, then `match_scorers`. A failure partway leaves a match with no squads or no scorer. Closing the toss modal then resets `matchId`, so the half-made match and its images in `avatars/<user>/friendly/<match>/` are never cleaned up.

## Shared contract (all jobs follow this)

```sql
public.create_friendly_match(p_match jsonb, p_players jsonb, p_scorer uuid default null) returns uuid
```

- **Security invoker.** The existing RLS policies remain the security boundary. The caller must be signed in (`authenticated` only; revoke from `public` and `anon`).
- **One transaction.** On return, the match row, every player and the optional scorer all exist. On error, none of them do.
- **Match fields the client may set:** `id`, `fixture_ref`, `title`, `team_a_name`, `team_a_short`, `team_a_tone`, `team_a_image_url`, `team_b_name`, `team_b_short`, `team_b_tone`, `team_b_image_url`, `overs_limit`, `toss_winner_side`, `toss_decision`, `record_shots`. The server sets `status = 'scheduled'`, `started_at = null` and `created_by = auth.uid()`. The server ignores result columns, `created_by`, `status` and any other key.
- **Validation (raise with a clear message):**
  - `id` is a uuid.
  - `fixture_ref` starts with `friendly-`.
  - `p_players` is a non-empty array, and every player has `key`, `side` in (`a`, `b`), `name` and `sort_order`.
  - The server forces each player's `match_id` to the match id.
  - `p_scorer` is null, `auth.uid()`, or the `profile_id` of a player in `p_players`.
- **Idempotent on `id`:**
  - Same caller and the match already has its players: return the id and write nothing.
  - Same caller and an older partial match (no players, still `scheduled`): complete it.
  - The id belongs to another user: raise.
- **Concurrent calls:** two calls with the same id at once (a double tap, or a retry while the first is in flight) must both return success, and only one set of rows may be created. Insert the match with `on conflict (id) do nothing`. The second call then waits on the first call's row lock, and after that the idempotent branch applies.
- The `friendly_single_scorer` trigger stays as it is.
- Tournament and non-friendly matches keep using `createMatch` and the outbox `create` op. Change neither.

---

## Job 1: migration and SQL verification

**Model:** Claude Opus 5.5 · **Size:** L · **Depends on:** nothing

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo (Expo + Supabase).
BRANCH: feat/atomic-friendly-create
READ FIRST: AGENTS.md, memory.md, FRIENDLY_MATCH_HANDOFF.md,
  docs/tasks/step-3-atomic-friendly-create.md (the "Shared contract" section is binding),
  supabase/migrations/20261029181703_matches.sql, 20261029192151_match_team_images.sql,
  20261029194934_friendly_exclusive_scorer.sql.

TASK
1. Create supabase/migrations/20261031120000_create_friendly_match.sql implementing
   public.create_friendly_match exactly as the shared contract says. Use language plpgsql,
   security invoker, set search_path = ''. Fully qualify every name. Revoke from public and anon;
   grant execute to authenticated. Add a header comment in the style of the existing migrations.
2. Create supabase/tests/create_friendly_match.sql: a verification script that runs inside
   begin ... rollback, sets role authenticated and request.jwt.claims for fixture users, and
   uses raise exception for every failed assertion. Cover:
   a) a complete create returns the id, with 1 match, N players and the scorer present;
   b) a repeat call with the same payload succeeds and adds no rows;
   c) a failing player row (bad side) leaves no match row;
   d) a scorer not in the squad is rejected and nothing is written;
   e) a non-friendly fixture_ref is rejected;
   f) another user reusing the id is rejected;
   g) a client-sent status='completed' or created_by is ignored;
   h) a legacy partial match (match row only) is completed by the call;
   i) after creation with an assigned scorer, the creator cannot insert ball_events.
   End with a query proving that nothing persisted.
3. Write a short note in the test file explaining how to check concurrency by hand
   (two SQL sessions, same id, the first left uncommitted).

RULES
- Do not run supabase db push and do not apply anything to the remote project. The human applies it.
- Files must stay at or under 200 lines (hard limit 270).
- Do not touch src/.

DONE WHEN: both files exist, the SQL parses, and you report the memory.md section 11 six-point
report with PASS/FAIL/NOT RUN for every check (the remote run is NOT RUN unless the human ran it).
```

---

## Job 2: app wiring, image cleanup, tests

**Model:** Claude Sonnet 5.5 · **Size:** M · **Depends on:** Job 1 merged into the branch. Regenerating types needs the migration applied.

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/atomic-friendly-create (Job 1's migration is already on it)
READ FIRST: AGENTS.md, memory.md, docs/tasks/step-3-atomic-friendly-create.md (shared contract),
  src/features/match/friendly-setup-screen.tsx, src/features/match/friendly/team-images.ts,
  src/features/scoring/data/match-repository.ts, src/features/scoring/data/match-rows.ts,
  src/features/match/__tests__/friendly-setup-screen.test.tsx.

TASK
1. Regenerate src/lib/database.types.ts with `pnpm gen:types` (never hand-write types).
   If the migration is not applied remotely yet, stop and say so.
2. Add createFriendlyMatch(match, players, scorer) in a new file
   src/features/scoring/data/friendly-create.ts. It calls supabase.rpc('create_friendly_match', ...)
   and throws on error. It accepts at most one scorer, and an empty list becomes null.
3. In friendly-setup-screen.tsx, replace createMatch with createFriendlyMatch. Keep saveLock
   and the stable matchId for retries.
4. Image cleanup in src/features/match/friendly/team-images.ts:
   a) removeTeamImages(userId, matchId) lists avatars/<user>/friendly/<match>/ and removes those files.
   b) When the user closes the toss modal after a failed save (the point where matchId is
      reset), check whether the match exists on the server. If it does not, call
      removeTeamImages for the old id. Never remove images of a match that exists.
   c) sweepOrphanTeamImages(userId): for folders under avatars/<user>/friendly/ whose files
      are older than 24 h and whose id has no matches row, remove them. Run it at most once
      a day per account when the setup screen mounts. Errors stay silent: cleanup must never
      block setup.
5. Jest:
   - setup screen calls createFriendlyMatch with the right arguments;
   - a failed save then close removes the images of a match that does not exist;
   - images are kept when the match does exist;
   - the sweep keeps young folders and folders of existing matches;
   - a double tap sends one call.
   Update the existing mocks of createMatch in the setup screen test.

RULES
- Screens never call Supabase directly; go through the data files.
- Files must stay at or under 200 lines (hard limit 270). Match the surrounding style and comment density.
- No new native packages. This must ship as an OTA update.
- Do not edit supabase/ files.

DONE WHEN: pnpm typecheck, pnpm lint (0 warnings) and pnpm test all pass, reported with the
memory.md section 11 six-point report.
```

---

## Job 3: independent review

**Model:** GPT 6.1 · **Size:** review · **Depends on:** Jobs 1 and 2 on the branch

```text
ROLE: Independent reviewer. You did not write this code. Find defects; do not rewrite.
TARGET: git diff main...feat/atomic-friendly-create in the esSports repo.
READ FIRST: docs/tasks/step-3-atomic-friendly-create.md (the shared contract is the spec),
  supabase/migrations/20261029181703_matches.sql and 20261029194934_friendly_exclusive_scorer.sql.

CHECK
1. Atomicity: can any path return success while rows are missing, or leave rows after an error?
2. Security: can a caller set created_by, status or result fields, write to another user's match,
   pick a scorer outside the squad, or get around RLS (invoker vs definer, search_path)?
3. Concurrency: two calls with the same id. Is there a deadlock, a duplicate, or a false error?
   Does it work with the friendly_single_scorer trigger's FOR UPDATE lock?
4. Idempotency: is a repeat call harmless? Does a legacy partial match complete correctly?
5. Image cleanup: can it ever delete images of a match that exists, or of another account?
6. Tests: do the SQL script and Jest tests actually fail when the behaviour is wrong?

OUTPUT: one line per finding: `path:line — severity (blocker/major/minor) — problem — fix`.
End with "Approve" or "Changes needed". No praise and no style nits.
```

---

## Job 4: docs and status

**Model:** Gemini Flash 3.8 · **Size:** S · **Depends on:** the review approved and the PR merged

```text
ROLE: Technical writer on the esSports repo.
TASK: After step 3 is merged:
1. FRIENDLY_MATCH_HANDOFF.md: replace the paragraph starting "`createMatch` saves the match,
   players and scorer in separate requests" with a short description of create_friendly_match
   (atomic, idempotent, image cleanup), and remove recommended-next-work item 2.
2. NEXT_WORK.md item 3: add "Status: Done" with the merge commit and PR number.
3. docs/ROADMAP.md: mark step 3 done in Phase B and update "Current status" (next is step 4).
Only edit those three files. Keep the existing tone: short, plain, no marketing words.
```

---

## Your part (human)

1. After Job 1: run `npx supabase migration list` and confirm the local and remote versions match. Then run `npx supabase db push`, and run `supabase/tests/create_friendly_match.sql` in the SQL editor. It must finish with no exception and leave nothing behind.
2. After Job 2: open the PR. Then device check: create a friendly with images; turn Wi-Fi off at the toss, retry, then close; reopen and check that no half-made match is in "Your saved matches".
3. After merging: publish an OTA update to `preview`.

---

## Round 2: fixes from the Job 3 review

The review asked for changes; all three findings were checked against the code and confirmed.

| # | Finding | Decision |
| --- | --- | --- |
| R1 | `discardUnsavedTeamImages` checks "match exists?" and then deletes. A save that timed out on the phone can still reach the server after the check, so the match ends up with deleted images. | **Remove the immediate discard.** Rely only on the daily sweep. A save can't still be in flight more than 24 hours after its images were uploaded (friendlies are not created through the outbox), so the age threshold closes the race without a server tombstone. Orphan images live up to about a day longer, which costs only storage. |
| R2 | The sweep checks the first 50 folders every time. Saved matches fill that budget, so later orphans are never reached. | List every folder (page through the root listing). Drop the ids that have a saved match first, in batches. Only then list files and check age, for at most 50 unsaved candidates. |
| R3 | The migration validates the payload, and runs the insert's constraints and RLS check, before looking for an existing match. A same-owner retry with changed or invalid fields fails instead of returning the id. | New migration: after validating the id, take the advisory lock and check for an existing match (owner, friendly, players present → return the id). Validate the remaining fields only for a new or partial match. |

**R3 is a new migration file.** `20261031120000` is already applied remotely; never edit it.

### Job 5: R3 migration fix

**Model:** Claude Opus 5.5 · **Size:** M (SQL, concurrency) · **Depends on:** nothing

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo.
BRANCH: feat/atomic-friendly-create
READ FIRST: docs/tasks/step-3-atomic-friendly-create.md (shared contract + Round 2),
  supabase/migrations/20261031120000_create_friendly_match.sql, supabase/tests/create_friendly_match.sql.

TASK
1. Add supabase/migrations/20261031130000_create_friendly_match_retry_first.sql with
   `create or replace function public.create_friendly_match(...)`. Same signature, security
   invoker, search_path, grants. Order:
   sign-in check -> id is a uuid -> pg_advisory_xact_lock(id) -> look up the existing match.
   If it exists:
     - another owner or not a friendly: raise;
     - players present: return the id;
     - started: raise;
     - otherwise continue as a partial match.
   Only then validate fixture_ref, the match fields, the players and the scorer, and insert.
   Do NOT edit 20261031120000_create_friendly_match.sql (already applied remotely).
2. Extend supabase/tests/create_friendly_match.sql with: a same-owner retry whose payload has an
   invalid tone/overs/players and a different scorer still returns the id and changes no rows.
   Keep every existing case passing.

RULES: no db push, no remote changes, no src/ edits, files at or under 200 lines.
DONE WHEN: the SQL parses; memory.md section 11 report with PASS/FAIL/NOT RUN.
```

### Job 6: R1 and R2 app fixes

**Model:** Claude Sonnet 5.5 · **Size:** M · **Depends on:** nothing (can run in parallel with Job 5; no shared files)

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/atomic-friendly-create
READ FIRST: docs/tasks/step-3-atomic-friendly-create.md (Round 2),
  src/features/match/friendly/team-images.ts, team-image-sweep.ts, friendly-setup-screen.tsx,
  and their tests.

TASK
1. R1: delete discardUnsavedTeamImages and the failedSave ref. closeToss only resets state and
   the match id. Keep removeTeamImages only if the sweep uses it; otherwise delete it. Update
   the doc comments to say that cleanup is the daily sweep, with the 24 h age as the safety margin.
2. R2: in sweepOrphanTeamImages:
   a) page through bucket.list(root) with limit/offset until a page is short;
   b) keep uuid folder names; call existingMatchIds in chunks of 100 and drop the saved ids;
   c) for at most 50 remaining candidates, list their files and keep only those whose files are
      all older than 24 h;
   d) remove those files in one call.
3. Tests:
   - closing the toss after a failed save deletes nothing;
   - the sweep reaches an orphan placed after 60 saved folders;
   - root listing pages are followed;
   - young folders and folders of saved matches are kept.

RULES: screens never call Supabase directly; files at or under 200 lines; no native packages;
no supabase/ edits.
DONE WHEN: pnpm typecheck, pnpm lint (0 warnings), pnpm test pass; memory.md section 11 report.
```

### Job 7: re-review

**Model:** GPT 6.1 · **Depends on:** Jobs 5 and 6

```text
Re-review git diff main...feat/atomic-friendly-create against the shared contract and Round 2
in docs/tasks/step-3-atomic-friendly-create.md. Confirm R1-R3 are fixed and nothing regressed.
Same output format as Job 3: `path:line — severity — problem — fix`, ending with Approve or
Changes needed.
```

### Your part (human), round 2

1. Run the SQL test on the remote project now, against the applied version, if you haven't already.
2. After Job 5: run `npx supabase migration list`, then `npx supabase db push`, then rerun `supabase/tests/create_friendly_match.sql`.
3. After Job 7 approves: open the PR, do the device check from round 1, merge, publish an OTA update, then run Job 4 (docs).

---

## Round 3: findings from the Job 7 re-review

| # | Finding | Fix (commits `5fd4dcd`, `7c838a5`) |
| --- | --- | --- |
| R4 | A phone paused between uploading images and saving can resume after the sweep checked for the match, so the new match points at deleted images. | `friendly_abandoned_ids` table plus `abandon_friendly_matches(ids)`, which takes the same advisory lock as `create_friendly_match`. A trigger on `matches` refuses abandoned ids (`EFA01`). The sweep deletes images only for ids the server confirms. The setup screen restarts with a new id on `EFA01`. |
| R5 | The same 50 unsaved folders can fill every sweep run. | Unsaved folders are checked in random order. |

**Status:** migration `20261031140000` applied on `es-sports`; `supabase/tests/friendly_abandoned_ids.sql` passed remotely; types regenerated; typecheck, lint and 431 tests pass.

**Review rule from here:** one final review round. Blockers and majors get fixed; minors go to the roadmap's "Deferred or open" list instead of blocking the merge.

### Job 8: final review

**Model:** GPT 6.1 · **Depends on:** the branch pushed

```text
ROLE: Independent reviewer. Final round for step 3 of esSports.
TARGET: git diff main...feat/atomic-friendly-create
SPEC: docs/tasks/step-3-atomic-friendly-create.md (shared contract, Rounds 2 and 3).
SCOPE: confirm R1-R5 are fixed, and look for regressions in:
  supabase/migrations/20261031130000_*.sql, supabase/migrations/20261031140000_*.sql,
  src/features/match/friendly/team-image-sweep.ts, src/features/scoring/data/friendly-create.ts,
  src/features/match/friendly-setup-screen.tsx.
Check especially: lock ordering between abandon and create (deadlocks), the trigger seeing every
account's rows, RLS on friendly_abandoned_ids, and whether any path can delete images of a match
that exists.
OUTPUT: one line per finding: `path:line — severity (blocker/major/minor) — problem — fix`.
Mark anything that is a residual risk rather than a defect as "accept". End with Approve or
Changes needed. Minors alone do not block approval.
```
