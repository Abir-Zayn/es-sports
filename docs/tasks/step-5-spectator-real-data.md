# Step 5: spectator screens on real data

Roadmap step 5. Branch: `feat/spectator-real-data`, from `main` at `99d52d4`. Built while the owner was away; not pushed.

## What was already there

The five match tabs (live, scorecard, overs, wagon, info) already read the saved match through `useLiveMatchData` and polled a live match every 15 seconds. What was left:

1. A real match id that failed to load (offline, or not found) showed the **sample preview match** in its place, so a spectator could take made-up numbers for the real score.
2. No Realtime: updates arrived only by polling.
3. Leftover `matchHeader` sample defaults for the route id and the frame title.

## What changed

- **`use-live-match-data.ts`:**
  - A match id (uuid) opens that saved match or fails: an error when offline, `MatchNotFoundError` when it doesn't exist or can't be seen.
  - Fixture references (tournament sample fixtures and staged friendlies) keep the staged or sample fallback.
  - "Not found" is never retried; other failures are retried twice.
- **`live/match-channel.ts`:** one Realtime channel per match, shared by all its open tabs.
  - It listens to `ball_events` (by `match_id`) and `matches` (by `id`).
  - A burst of changes, such as an undo that voids several balls, triggers one refresh 400 ms later.
  - The channel is removed when the last tab closes, and a pending refresh is cancelled.
  - While the channel is connected, polling slows to 60 s as a safety net. While it isn't connected, polling stays at 15 s.
- **`components/match-load-state.tsx`:**
  - `MatchLoadState` shows a spinner, "could not load" with a **Try again** button, or "could not be found".
  - `StaleMatchNote` appears when a refresh fails while an older score is still shown.
  - The live tab's loading and error states now sit inside the match frame, so the back button and tabs are always there.
- **`sample-match` removed** from the five screens and the frame. It is now used only by the sample preview builder.
- **Migration `20261101020000_realtime_match_tables.sql`:** adds `matches` and `ball_events` to the `supabase_realtime` publication. It is idempotent. Row level security still decides what each subscriber receives (both tables are readable by any signed-in user). **Not applied.** Until it is, the channel receives nothing and the app keeps polling at 15 s, so the app works either way.

## Verification

- `pnpm typecheck`: PASS
- `pnpm lint`: PASS (0 warnings)
- `pnpm test`: PASS (77 suites, 451 tests)
- New tests:
  - a saved id never falls back to the sample;
  - one shared channel per match, removed after the last tab;
  - a burst of changes gives one refresh;
  - connection status, and a pending refresh cancelled on stop;
  - the load-state messages.
- NOT RUN:
  - the migration (not applied);
  - Realtime against the live project;
  - a device check.

## Owner's steps

1. Merge the step 4 round 2 branch (`fix/scoring-score-head`) first. This branch does not depend on it.
2. Run `npx supabase migration list`, then `npx supabase db push`. That applies `20261101020000`, plus `20261101010000` if it isn't applied yet.
3. Device check: open a live friendly as a spectator on a second phone. Each ball should appear within about a second. With Wi-Fi off, the screen should show "Could not refresh. Showing the last saved score."
4. Review (GPT 6.1, one round): see the review brief below.

## Review

**Model:** GPT 6.1 · **Depends on:** PR #11 open (it does not need the migration applied)

```text
ROLE: Independent reviewer for step 5 of esSports. One review round, plus one re-check of fixes.
TARGET: git diff origin/main...origin/feat/spectator-real-data (PR #11)
SPEC: docs/tasks/step-5-spectator-real-data.md
FILES: src/features/match/live/match-channel.ts, src/features/match/use-live-match-data.ts,
src/features/match/components/match-load-state.tsx, the five match-*-screen.tsx files,
components/match-screen-frame.tsx, supabase/migrations/20261101020000_realtime_match_tables.sql
CHECK
1. Channel lifetime: is there exactly one channel per match however many tabs mount and unmount?
   Is it removed after the last one, with a pending refresh cancelled? Can a fast unmount/remount
   (tab switch, React strict mode) leak a channel or remove one still in use?
2. Is a saved match id (uuid) ever shown as the sample or staged match: offline, not found, RLS
   hidden, or during a retry? Do fixture references still get their fallback?
3. Error states: is "not found" separate from a network error, never retried, and a Try again that
   works? Does an old score stay on screen with the stale note when a refresh fails, never blanked?
4. Polling: 15 s when the channel is not connected and 60 s when it is, only for a stored live
   match. Does a completed match stop polling and close its channel?
5. Realtime and RLS: does the publication leak any row a spectator cannot already select? Is the
   migration safe to run twice?
6. Render safety: no raw text outside <Text>, no `{n && <View/>}`, optional chaining on server data.
OUTPUT: `path:line — severity (blocker/major/minor) — problem — fix`; mark residual risks "accept";
end with Approve or Changes needed. Minors alone do not block; they go to the roadmap's deferred list.
```
