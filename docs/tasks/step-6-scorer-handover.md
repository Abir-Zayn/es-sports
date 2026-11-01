# Step 6: scorer handover and recovery

Roadmap step 6 / NEXT_WORK item 5. Branch: `feat/scorer-handover`, from `main` at `7989ede`. Models: Argon 4 builds it, Claude reviews, GPT 6.1 Terra gives the independent review of the migration.

## Problem

A friendly has exactly one scorer (`friendly_single_scorer` trigger, `can_score_match`). The creator cannot remove or replace them (policy `match_scorers: creator can remove from non-friendly matches`). If the scorer leaves, loses their phone or runs out of battery, the match is stuck until someone edits the database by hand. Step 4 made stale writes safe (`ESC01`, score head), so a handover can now be built without two writers interleaving.

## Decisions (the owner may change a value; the contract names it)

| Question | Decision |
| --- | --- |
| Scope | Friendlies only (`fixture_ref like 'friendly-%'`). Tournament matches get their own scorer assignment in step 16. |
| Who can start a handover | The **current scorer** (to anyone), or the **creator** (see takeover). |
| Who must accept | Always the named new scorer. Nobody is made scorer without accepting. |
| Offer expiry | **15 minutes**. A match is live, so a stale offer must not sit for days. |
| Creator takeover | The creator may offer to themselves (and accept at once) only when the match has had **no new ball for 15 minutes**, or has no balls yet. Checked at offer **and** at accept. |
| Allowed match status | Not `completed`. A finished match needs `reopen_match` by the scorer first. |
| Old scorer's unsent changes | They fail with `42501` after the swap and use the existing "Discard unsent changes" flow, worded "Scoring moved to <name>". The new scorer starts from the server state. Not merged. |
| Pending offers | One per match. A second offer needs the first to be cancelled, declined, accepted or expired. |
| Notifications | None yet (step 20). The new scorer sees a banner on the Matches tab, loaded on focus. No share link in this step. |

## Shared contract (all jobs follow this)

### Table `public.scorer_handover`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid pk | `gen_random_uuid()` |
| `match_id` | uuid not null | fk `matches`, on delete cascade |
| `from_user` | uuid not null | the scorer when the offer was made; fk `auth.users` |
| `to_user` | uuid not null | the proposed scorer; fk `auth.users`; check `to_user <> from_user` |
| `initiated_by` | uuid not null | the caller; the scorer or the creator |
| `status` | text not null | `pending`, `accepted`, `declined`, `cancelled`, `expired`; check constraint |
| `expires_at` | timestamptz not null | `created_at + interval '15 minutes'` |
| `created_at`, `resolved_at` | timestamptz | `resolved_at` is null while pending |

- Partial unique index: one row per `match_id` where `status = 'pending'`.
- RLS on; `select` for `from_user`, `to_user`, `initiated_by` and the match creator. **No insert, update or delete policy**, and revoke those grants from `authenticated` and `anon`. Every change goes through the functions below.
- A pending row whose `expires_at` has passed counts as expired. Each function sets such a row to `expired` before it reads state (lazy expiry; no cron).
- Add the table to the `supabase_realtime` publication (idempotent, like `20261101020000`).

### Functions (security definer, `set search_path = ''`, execute for `authenticated` only)

| Function | Returns | Rule |
| --- | --- | --- |
| `offer_scorer_handover(p_match uuid, p_to uuid)` | the new `id` | Caller is the current scorer, or the creator (creator offering to anyone but themselves is allowed only when the scorer is gone: the idle rule applies to every creator-initiated offer). `p_to` must have a `profiles` row and must differ from the current scorer. |
| `accept_scorer_handover(p_id uuid)` | void | Caller is `to_user`. |
| `decline_scorer_handover(p_id uuid)` | void | Caller is `to_user`. |
| `cancel_scorer_handover(p_id uuid)` | void | Caller is `initiated_by`, `from_user` or the match creator. |

Order inside `offer` and `accept`:
1. Sign-in check, else `42501`.
2. Take `pg_advisory_xact_lock(hashtextextended('score_match:' || p_match, 0))`, the **same key** as the step 4 write functions. An in-flight ball write finishes before the swap, and a write after it fails `can_score_match`. At no moment can two accounts write.
3. Lazy expiry, then the checks from the table above.
4. `accept` only: confirm `from_user` is still the current scorer (else set `cancelled` and raise `ESH03`); for a creator-initiated offer, run the idle rule again. Then, **in this order**, delete the old `match_scorers` row and insert the new one, and set the offer `accepted` with `resolved_at`. The `friendly_single_scorer` trigger allows this as is, because the old row is gone before the insert. **Do not weaken or drop the trigger.**
5. `decline` and `cancel`: set the status if `pending`. A repeat on a row already in that status returns OK (a lost reply). Any other status raises `ESH01`.
6. `accept` on an `accepted` row whose `to_user` is the caller returns OK (idempotent).

Error codes (SQLSTATE, message):

| Code | Message | When |
| --- | --- | --- |
| `42501` | | Not allowed |
| `ESH01` | `This scoring request is no longer open` | Not pending, or expired |
| `ESH02` | `Scoring is already being handed over` | A pending offer exists |
| `ESH03` | `The scorer changed` | `from_user` is no longer the scorer |
| `ESH04` | `The scorer was active a moment ago` | Creator takeover while a ball was written within 15 minutes |
| `ESH05` | `This match is finished` | Status is `completed` |

The idle rule uses the newest `ball_events` row's server timestamp (Argon: confirm the column in `20261029181703_matches.sql`; if none exists, say so in the report and stop before inventing one).

### Client contract

- Folder `src/features/scoring/handover/`. Every file is at most 200 lines (hard 270).
- `handover-repository.ts` wraps the four RPCs and two reads: `fetchOpenHandover(matchId)` and `fetchIncomingHandovers(userId)`. It maps `ESH01..ESH05` and `42501` to plain messages in `handover-errors.ts`.
- Until `database.types.ts` is regenerated, Job 2 uses local types in `handover/types.ts` and a typed `rpc` wrapper. Job 2 swaps them to the generated types once Job 1's types are merged.

---

## Job 1: migration and SQL verification

**Model:** Argon 4 · **Size:** L · **Depends on:** nothing

```text
ROLE: Senior Postgres/Supabase engineer on the esSports repo.
BRANCH: feat/scorer-handover (create it from main).
READ FIRST: AGENTS.md, memory.md, docs/tasks/step-6-scorer-handover.md (shared contract is binding),
  supabase/migrations/20261029181703_matches.sql, 20261029194934_friendly_exclusive_scorer.sql,
  20261101000000_scoring_write_guard.sql (lock key and style), 20261101020000_realtime_match_tables.sql.

TASK
1. supabase/migrations/20261101030000_scorer_handover.sql: the table, RLS, grants, index, the four
   functions and the realtime publication line, exactly per the contract. Header comment in the style
   of the existing migrations. Revoke from public and anon.
2. supabase/tests/scorer_handover.sql: rolled-back script (begin ... rollback), fixture users and a
   friendly with an assigned scorer, `raise exception 'FAIL ...'` on any failed assertion, ending with
   a select that shows the result. Cover:
   a) offer by the scorer, accept by the target: match_scorers holds only the target, can_score_match
      flips, the offer is accepted, and the old scorer now gets 42501 from append_ball_event;
   b) an unrelated user, and the creator with a recently active scorer, cannot offer (42501 / ESH04);
   c) decline, cancel (by each allowed party) and expiry (set expires_at in the past): ESH01 on accept;
   d) a second offer while one is pending: ESH02;
   e) creator takeover: idle >= 15 min (backdate the newest ball) succeeds; a recent ball gives ESH04
      at offer and at accept (a ball written between offer and accept);
   f) the scorer changed between offer and accept: ESH03 and the offer is cancelled;
   g) completed match: ESH05; non-friendly match: refused;
   h) a repeated accept / decline / cancel returns OK; a wrong-status call raises ESH01;
   i) direct insert, update or delete on the table by an authenticated user is refused;
   j) the friendly_single_scorer trigger is untouched: inserting a second scorer row directly still raises.
   In the header, add a manual two-session check: session A calls append_ball_event while session B
   calls accept_scorer_handover for the same match; the two serialize on the advisory lock, and A's
   next write fails 42501.
3. Report: the SQL test output, what you could not run, and any place the contract was unclear.

DO NOT apply the migration to the remote project. DO NOT edit app code or database.types.ts.
OUTPUT: the memory.md section 11 report.
```

---

## Job 2: data layer and screens

**Model:** Claude Sonnet 5.5 (UI wiring, hooks, Jest) · **Size:** M · **Depends on:** Job 1's migration file for the contract (not for the DB)

```text
ROLE: React Native / Expo engineer on the esSports repo.
BRANCH: feat/scorer-handover-ui, from main. Rebase on Job 1's branch before opening the PR.
READ FIRST: AGENTS.md, memory.md, docs/tasks/step-6-scorer-handover.md ("Decisions", "Client contract"),
  src/features/scoring/data/outbox-errors.ts, scoring-errors.ts, src/features/scoring/components/scorer-error.tsx,
  the friendly setup player search (reuse it for the picker), src/features/scoring/pad-screen.tsx.

TASK
1. handover/handover-repository.ts, handover-errors.ts, types.ts, use-handover.ts (TanStack Query, per
   existing hooks), per the client contract.
2. Scorer screen: "Hand over scoring" action -> player picker (app accounts only; guests cannot score)
   -> confirm -> a status line "Waiting for <name>" with Cancel. Show the 15-minute expiry. A declined or
   expired offer clears the line with a short message.
3. Incoming offer: a banner on the Matches tab (real query, refetched on focus) and a screen
   `handover/[id]`: the two teams, the score so far, Accept / Decline. After accepting, open the scorer
   for that match (loadScorer reads the server state).
4. Old scorer: when a write fails 42501 after a swap, scorer-error shows "Scoring moved to <name>"
   (read the new scorer's name), explains that unsent changes cannot be applied, and offers the existing
   confirmed "Discard unsent changes". No automatic discard.
5. Creator: on the match info/scorer entry, "Take over scoring" shown only when the match is live and
   the scorer has been idle >= 15 min (the server decides; show its ESH04 as "<name> scored a moment ago").
6. Jest tests: error mapping, repository calls with a mocked client, the pending status line, the
   banner, the old-scorer message. Zero-crash render safety (no raw text outside <Text>, no `{n && <View/>}`).

DO NOT touch supabase/. Run `pnpm typecheck`, `pnpm lint`, `pnpm test` and report PASS | FAIL | NOT RUN.
OUTPUT: the memory.md section 11 report.
```

---

## Job 3: docs

**Model:** Gemini Flash 3.8 · **Size:** S · **Depends on:** nothing (run in parallel)

```text
ROLE: Technical writer on the esSports repo.
TASK: (1) docs/ROADMAP.md: replace "Current status" with the state at 7989ede (steps 1-5 merged, PRs #5-#12,
  step 6 in progress, migrations 20261101000000, 010000 and 020000 not yet applied remotely); update the
  step 6 line and the "Open decisions" table (step 6 decided, link this spec). (2) NEXT_WORK.md item 5:
  replace "Product decisions needed" with a link to docs/tasks/step-6-scorer-handover.md. (3) Add rows
  13-15 to docs/device-test-log.md as NOT RUN: hand over mid-over with no lost or duplicate ball (two phones),
  decline and expiry, creator takeover after 15 minutes idle.
Do not change code or invent results. Keep every line short.
```

---

## Review plan (after Jobs 1 and 2)

1. **Claude** reviews both diffs against this spec (lock key, order inside the functions, trigger untouched, RLS on the table, idempotent repeats, render safety).
2. **GPT 6.1 Terra** gives an independent review of the migration and SQL tests only. Questions: can two accounts write at any moment, can a creator take over from an active scorer, can a user read or change a handover they are not part of, is the migration safe to run twice.
3. One fix round, one re-check. Minors go to the roadmap's deferred list.

## Review notes (Job 1, round 1)

- **Contract fix:** a function that raises rolls back its own earlier `update`. So "set the offer `expired` / `cancelled`, then raise" (`ESH01`, `ESH03`) cannot persist the new status. The status is saved only when a later `offer_scorer_handover` call commits (it expires or cancels stale pending rows first). Result: a stale row can stay `pending` in the table.
  - **Client rule (Job 2):** treat a `pending` row as open only when `expires_at > now()`. On `ESH03` or `ESH01` show "this request is no longer open" and refetch; do not retry.
- **Creator as the scorer:** when the creator is the current scorer (no `match_scorers` row, or after a takeover), the creator's offer is a normal handover and skips the 15-minute idle rule. The idle rule applies whenever the creator is not the current scorer. Accepted.
- **Real signatures:** after step 4 round 2 the write functions take `p_expected_head` (and `p_op`), not a tail. The SQL test uses the real signatures.
- **Open:** `supabase/tests/scorer_handover.sql` is NOT RUN (no Docker or psql here). It must pass in the Supabase SQL editor after `db push`, plus the manual two-session check, before merge.

## Review notes (GPT 6.1 Terra, round 1)

| Finding | Verdict |
| --- | --- |
| Creator offers to a third party while the scorer is idle (`:82`) | **Fixed.** A creator who is not the scorer may only offer to themselves (`42501` otherwise). Test added. |
| `now()` is the transaction start, so an accept that waited on the lock can pass an expired offer (`:111`) | **Fixed.** Expiry and idle checks use `clock_timestamp()`. Rated minor: the wait is seconds, the window 15 minutes. |
| `sht_fail` passes on NULL (test `:49`) | **Fixed.** It fails unless `p_ok is true`. |
| Two-session check misses the old scorer's write waiting behind an accept (test `:7`) | **Fixed in the header.** Check 1 is the post-lock re-check, check 2 the reverse order. Still NOT RUN. |
| Creator-insert policy on `match_scorers` can assign a scorer without acceptance when no row exists (`:73`) | **Accept, tracked.** It is the original assignment path (the creator gives scoring away; they lose it at once) and `create_friendly_match` relies on it. Closing it belongs with step 4b (revoke direct writes). Rated minor, not major. |
| Legacy direct scoring writes bypass the lock (`:40`) | **Accept.** Step 4b. |

The migration changed after it was applied: re-run it (`create or replace`, idempotent) and the test before merge.

## Review brief (GPT 6.1 Terra, migration and SQL test only)

```text
ROLE: Independent reviewer for step 6 of esSports. One round, then one re-check.
TARGET: git diff main...feat/scorer-handover
SPEC: docs/tasks/step-6-scorer-handover.md (contract and "Review notes")
FILES: supabase/migrations/20261101030000_scorer_handover.sql, supabase/tests/scorer_handover.sql
CHECK
1. Can two accounts write at any moment? Follow append_ball_event -> begin_scoring_write against
   accept_scorer_handover: lock key, the re-check of can_score_match after the lock, the delete-then-insert swap.
2. Can the creator take scoring from an active scorer? Check the 15-minute rule at offer and at accept,
   and the creator-is-the-scorer case.
3. Can a user read, create, change or cancel a handover they are not part of? RLS, grants, and every
   42501 path, including a missing row and a signed-out caller.
4. Is a stale `pending` row (rolled-back expiry) able to block or confuse the next offer or accept?
5. Is the migration safe to run twice? Is friendly_single_scorer untouched?
6. Does each assertion in the SQL test really fail when the behaviour is wrong? Name any that cannot.
OUTPUT: `path:line — severity (blocker/major/minor) — problem — fix`; residual risks "accept";
end with Approve or Changes needed. Do not run anything against the remote project.
```

## Owner's steps

1. Run the jobs: Job 1 (Argon), Job 2 (Sonnet) and Job 3 (Flash) can run at the same time. Job 2 rebases on Job 1 at the end.
2. After review: `npx supabase db push`, then regenerate `src/lib/database.types.ts` and let Job 2 switch to the generated types.
3. Device check with two phones (rows 13-15). Leave step 4b (revoke direct table writes) until the OTA update with the step 4 guard is on every phone.
