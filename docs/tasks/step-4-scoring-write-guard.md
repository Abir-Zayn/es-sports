# Step 4: server-side guard on scoring write order

Roadmap step 4 / NEXT_WORK item 4. Branch: `feat/scoring-write-guard`. Start it from `main` once PR #8 is merged, so `src/lib/database.types.ts` does not conflict.

## Problem

The outbox (`src/features/scoring/data/outbox.ts`) checks the server only when it resumes changes left from an earlier run (`resumeIndex`). During a session it sends straight to the tables: `ball_events` upsert, `void_events_from`, and `matches` updates for result and reopen. The server accepts any write from an allowed scorer. A second phone on the same account, or the old scorer during a handover (step 6), can therefore interleave balls, and nothing stops it.

## Shared contract (all jobs follow this)

Every scoring write names the **expected tail**: the id of the last live event (`voided_at is null`, highest `seq`) the phone believes the server holds, or null when it expects none. The server refuses the write when its tail is different.

| Function | Replaces | Idempotent repeat (a lost reply) |
| --- | --- | --- |
| `append_ball_event(p_row jsonb, p_expected_tail uuid)` returns void | `ball_events` upsert in `applyOp` | Event id already stored for this match: return OK without checking the tail. Stored for another match: raise. |
| `void_ball_events_from(p_match uuid, p_event uuid, p_expected_tail uuid)` returns void | `void_events_from` | `p_event` already voided: return OK. |
| `save_match_result(p_match uuid, p_result jsonb, p_expected_tail uuid)` returns void | `saveResult` | Same values written again; the tail is unchanged by a result. |
| `reopen_match(p_match uuid, p_expected_tail uuid)` returns void | `reopenMatch` | Already live with a null result: return OK. |

- **Order inside each function:**
  1. Sign-in check.
  2. `public.can_score_match(p_match)`, or raise `42501`.
  3. `pg_advisory_xact_lock(hashtextextended('score_match:' || p_match, 0))`.
  4. The idempotent-repeat check from the table.
  5. Tail check: raise errcode **`ESC01`** with the message `This match was changed on another device` when the tail differs.
  6. The write.
- **Security definer, `set search_path = ''`, with the explicit `can_score_match` check.** Definer is chosen now so that a later migration can revoke direct table writes (step 4b) without rewriting these functions. Grant execute to `authenticated` only.
- `append_ball_event` accepts only the columns in `BallEventInsert` (`src/features/scoring/data/types.ts`). It forces `match_id` from the row and normalizes empty optional player keys to null (the issue #6 bug). The table's checks and foreign keys still apply.
- `save_match_result` writes only the `ResultUpdate` columns and forces `status = 'completed'`.
- **Out of scope:**
  - Shot direction (`angle`) updates keep their current path. They change no order, and a wrong angle is cosmetic.
  - `create`/`start` ops: no events exist yet.
  - Revoking direct table writes: that is step 4b, done after the OTA update is on phones, so builds that are not yet updated keep scoring.
- `void_events_from` and the existing grants stay. Nothing is dropped in this step.

---

## Job 1: migration and SQL verification

**Model:** Claude Opus 5.5 · **Size:** L · **Depends on:** nothing

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo.
BRANCH: feat/scoring-write-guard
READ FIRST: AGENTS.md, memory.md, docs/tasks/step-4-scoring-write-guard.md (shared contract is binding),
  supabase/migrations/20261029181703_matches.sql, 20261029194934_friendly_exclusive_scorer.sql,
  src/features/scoring/data/types.ts (BallEventInsert, ResultUpdate).

TASK
1. supabase/migrations/20261101000000_scoring_write_guard.sql with the four functions in the
   contract: security definer, search_path '', fully qualified names, header comment in the style
   of the existing migrations. Revoke from public and anon; grant execute to authenticated.
2. supabase/tests/scoring_write_guard.sql: rolled-back script (begin ... rollback), fixture users
   and a friendly with an assigned scorer, `raise exception 'FAIL ...'` on any failed assertion,
   ending with a select that shows the result. Cover:
   a) appends in order with the correct tail succeed;
   b) a stale tail (two devices: the second sends tail = null after the first appended) fails with
      ESC01 and writes nothing;
   c) a repeated append of a stored id succeeds even with a stale tail, and adds no row;
   d) the same id under another match raises;
   e) void with the right tail voids the event and every later one; a repeat succeeds;
      a stale tail fails with ESC01;
   f) result and reopen: right tail OK, stale tail ESC01, repeat OK;
   g) the creator of a friendly with an assigned scorer, and an unrelated user, get 42501 from
      every function;
   h) empty-string player keys are stored as null;
   i) client-sent seq, voided_at or another match_id are ignored or rejected.
   In the header, add a manual two-session check: two sessions, same match, both appending with
   the same tail; one wins and the other gets ESC01.

RULES: no db push or remote changes; no src/ edits; files at or under 200 lines (hard limit 270).
DONE WHEN: both files exist; memory.md section 11 report with PASS/FAIL/NOT RUN (remote run NOT RUN
unless the human ran it).
```

---

## Job 2: app wiring and mid-session conflict

**Model:** Claude Sonnet 5.5 · **Size:** M · **Depends on:** Job 1 applied remotely and types regenerated

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/scoring-write-guard
READ FIRST: docs/tasks/step-4-scoring-write-guard.md, src/features/scoring/data/match-repository.ts,
  outbox.ts, outbox-ops.ts, sync-queue.ts, outboxes.ts, src/features/scoring/scorer-provider.tsx,
  pad-screen.tsx and the tests in src/features/scoring/data/__tests__/.

TASK
1. match-repository.ts: applyOp (insert, void), saveResult and reopenMatch take `expectedTail:
   string | null` and call the new functions. The angle update is unchanged. Map errcode ESC01 to a
   new `ScoringConflictError`.
2. outbox-ops.ts: sendOutboxOp(matchId, op, expectedTail) passes the tail through. create/start ignore it.
3. outbox.ts send(): the expected tail is `this.record.base.at(-1) ?? null` (base already tracks the
   server's live ids after every accepted change). On ScoringConflictError, throw
   OutboxConflictError and stop: no retries, keep every op on the phone.
4. sync-queue.ts: a job error marked as final (for example, an error with `final = true`) stops the
   queue at once without retrying, with status 'error'. retry() still resumes it.
5. Mid-session conflict UI: when the outbox stops on a conflict, the scorer pad shows the existing
   conflict choice (same wording and the same "Discard unsent changes" action as
   scorer-provider.tsx) and blocks further scoring until the person chooses. Reuse; do not duplicate
   the alert text.
6. Jest:
   - the tail sent equals the last live id after a series of inserts and a void;
   - a stale tail (ESC01) mid-session stops the queue after one attempt and keeps the ops;
   - a repeated insert after a lost reply succeeds;
   - discard after a conflict clears the ops;
   - the existing resume conflict tests still pass.

RULES: screens never call Supabase directly; files at or under 200 lines; no native packages
(ships by OTA); no supabase/ edits. Regenerate types with
`npx supabase gen types typescript --linked` from Git Bash (PowerShell `>` writes UTF-16).
DONE WHEN: pnpm typecheck, pnpm lint (0 warnings), pnpm test pass; memory.md section 11 report.
```

---

## Job 3: review

**Model:** GPT 6.1 · **Depends on:** Jobs 1 and 2 on the branch, PR open

```text
ROLE: Independent reviewer for step 4 of esSports. One review round, plus one re-check of fixes.
TARGET: git diff main...feat/scoring-write-guard
SPEC: docs/tasks/step-4-scoring-write-guard.md
CHECK
1. Can two writers with the same tail both succeed? Is the lock taken before the tail is read?
2. Lost replies: does every repeat succeed, and can a repeat ever be mistaken for a conflict or the
   reverse?
3. Security definer: is can_score_match checked before any read or write, search_path pinned,
   columns limited, match_id forced?
4. Is the outbox tail always the server's real last live id (after void, after resume, after
   rebase), so normal scoring never conflicts with itself?
5. Does a conflict stop the queue without retries and without dropping ops, and does the UI block
   scoring until the person chooses?
OUTPUT: `path:line — severity (blocker/major/minor) — problem — fix`; mark residual risks "accept";
end with Approve or Changes needed. Minors alone do not block.
```

---

## Job 4: docs and status

**Model:** Gemini Flash 3.8 · **Size:** S · **Depends on:** the PR merged

```text
ROLE: Technical writer on the esSports repo.
TASK after step 4 is merged:
1. FRIENDLY_MATCH_HANDOFF.md: in "Recovery after an app close", add two sentences on the tail check
   and the mid-session conflict notice.
2. NEXT_WORK.md item 4: "Status: Done" with the PR number and merge commit.
3. docs/ROADMAP.md: mark step 4 done, set "Current status" to step 5, and add step 4b ("revoke
   direct ball_events writes once the OTA update is on phones") under "Deferred or open".
Only those three files. Short, plain wording.
```

---

## Your part (human)

1. After Job 1: run `npx supabase migration list`, then `npx supabase db push`, then run `supabase/tests/scoring_write_guard.sql` in the SQL editor.
2. Regenerate the types (Git Bash): `npx supabase gen types typescript --linked > src/lib/database.types.ts`.
3. After Job 2: device row 9. Use your phone plus an emulator, signed in to the same account, on the same match: score on both. The second device should show the conflict at once, and **Discard unsent changes** should recover it.
4. After merging: publish an OTA update to `preview`, then plan step 4b.

---

## Round 2: fixes from the Job 3 review

| # | Finding | Fix |
| --- | --- | --- |
| R1 | A repeated append or undo was accepted even after another device voided or wrote past it, so the phone's view could drift without a conflict. | **Score head** (`20261101010000_score_head.sql`): `matches.score_head` holds the operation id of the last guarded write. A write is a repeat only when the head is its own id. An event that is stored but no longer the head is ESC01. |
| R2 | Result and reopen do not move the tail, so a retried result after another device reopened completed the match again. | Results and reopens carry their own operation id and move the head, so a competing or late result is ESC01. |
| R3 | After a final error, adding a change restarted the queue and resent the refused change. | `SyncQueue` stays halted after a final error until `retry()`. Ordinary network failures still restart on the next change. |
| R4 | A change the server refused for good (for example 42501 after a handover) could not be cleared, so the match could not be opened. | `OutboxRejectedError` (shares `OutboxStoppedError` with the conflict) blocks scoring with the same confirmed **Discard unsent changes** action, worded as permanent. |

**App:**
- Every guarded op carries its id: the event id for an append, the audit id for an undo, and a new id for a result or reopen. Changes saved by older versions get ids when their outbox loads.
- The outbox keeps `head`, reads it from the match on load, and resumes from it after a restart. Records from older versions still resume from the live event ids.
- The expected-tail functions are dropped: no released build calls them.

**Residual risk:** builds that still write the tables directly do not move the head. Step 4b closes that path.

### Job 3b: re-check

**Model:** GPT 6.1 · **Depends on:** migration `20261101010000` applied, types regenerated, branch pushed

```text
Re-check round 2 of step 4 (docs/tasks/step-4-scoring-write-guard.md, "Round 2"). Target:
git diff origin/main...origin/fix/scoring-score-head (PR #10). PR #9 merged round 1 only, so
this diff is all of round 2. Confirm R1-R4 are fixed and nothing regressed, in:
supabase/migrations/20261101010000_score_head.sql, supabase/tests/scoring_write_guard.sql,
src/features/scoring/data/outbox.ts, outbox-ops.ts, outbox-errors.ts, sync-queue.ts,
match-repository.ts, src/features/scoring/components/scorer-error.tsx.
This is the last round: blockers and majors only; mark residual risks "accept"; minors go to the
roadmap's deferred list. Output: `path:line — severity — problem — fix`, then Approve or Changes needed.
```
