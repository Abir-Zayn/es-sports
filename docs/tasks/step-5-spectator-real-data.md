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
4. Review (GPT 6.1, one round): channel cleanup and the one-channel-per-match rule, the not-found and error states, and the publication's RLS behaviour.
