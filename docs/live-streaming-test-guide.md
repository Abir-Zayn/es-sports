# Live streaming test guide: a 4-team tournament with two phones

Written 2026-11-10 for the first real test. Everything here is **untested on a device**: the code was written
and unit tested without a phone or a local Supabase. Expect to find bugs, and note them down.

## What you need

| Thing | Notes |
| --- | --- |
| Two Android phones | Phone **A** = owner and scorer. Phone **B** = moderator and **streamer** (it needs 4 GB RAM or more, a rear camera, and Android 9+). |
| Two esSports accounts | One per phone. |
| A Facebook account | To create the live video and copy its **Server URL** and **Stream key**. |
| A development build | The streamer phone needs a build that includes the native `live-stream` module (Phase 0). Expo Go and old APKs cannot stream. |

## One-time setup

1. **Apply the migrations** to the Supabase project (SQL editor or `supabase db push`), in order:
   `20261110000000_moderator_cap`, `20261110010000_demo_teams`, `20261110020000_fixture_streamers`.
   Then run the SQL tests in `supabase/tests/moderator_cap.sql` if you can (they roll back).
2. **Switch demo teams on** (test project only, never production):
   ```sql
   update public.app_flags set enabled = true where key = 'demo_data';
   ```
3. **Build with the testing tools visible.** In `.env`: `EXPO_PUBLIC_DEMO_TOOLS=1`
   (plus the Supabase and Google values). Then build and install on both phones:
   ```bash
   pnpm install
   npx expo run:android --device        # or: eas build --profile development --platform android
   npx expo start --dev-client -c
   ```
   Needs Android SDK and JDK 17 on the computer. Rebuild only when a native package changes.

## The test, step by step

1. **Phone A:** create a tournament. Choose **4 teams**, set the **start date to today** (the Start match button
   only shows for today's matches), a T10 or 6-over format and a small squad size (6 a side keeps it quick).
2. **Phone A, Teams tab:** under *Testing tools*, tap **Fill with demo teams**. Four "Demo ..." teams appear, each with
   a full squad. (If you already added a team of your own, the demo teams fill the free seats.)
3. **Phone A, Teams tab:** tap **Add teams**, then invite **phone B's account as a moderator** (search by name or id).
   A tournament can have at most **3 moderators**; a 4th invite is refused.
4. **Phone B:** open Notifications (or Invitations) and **accept** the moderator invitation.
5. **Phone A, Matches tab:** **Create schedule** (auto), publish it. Make sure at least one match is **today**.
6. The **dashboard card** at the top of the Matches tab shows the next match, a countdown and *No streamer chosen yet*.
   - Owner (A): tap **Choose streamer** and pick phone B's moderator. (Or on phone B tap **I will stream this match**.)
7. **Phone A:** tap **Start match N** (it is shown under the dashboard). Tap **Auto-pick both XIs**, choose
   yourself as scorer, **Start match**. The scorer opens.
8. **Phone B:** the dashboard card now says *Live now* and shows **Go live on Facebook**. Tap it.
   The console opens in landscape with the camera preview.
9. **Facebook:** create a live video, choose *Streaming software*, copy the **Server URL** and **Stream key**.
10. **Phone B:** paste both, tap **Go live**. On Facebook the preview should start within about 10-20 seconds; press
    **Go live** there too.
11. **Phone A:** score some balls. The scorebug in the stream should update within a few seconds, and a
    FOUR / SIX / WICKET flash should show.
12. **Phone B:** tap **End broadcast**. The match tile on phone A should stop saying *LIVE on Facebook*.
13. **Clean up:** on the Teams tab tap **Remove demo teams** (refused while teams still have scheduled matches).

## Things to watch and write down

- Time from **Go live** to video on Facebook. Does the overlay show on Facebook (not just in the preview)?
- Does the overlay stop updating when the screen locks or the app goes to the background?
- Kill the app on phone B mid-stream. Does the **Resume** card appear when you reopen the console?
- Battery and heat after 10 minutes. Network switch (Wi-Fi to mobile data) while live.
- Does the spectator view (any other account) show *LIVE on Facebook*?

## Known limits (by design, for now)

- **Facebook only, Android only.** YouTube is one `check` away on the server and is hidden in the app.
- The **streamer must be a tournament moderator**. The owner cannot stream unless also added as a moderator
  (use a second account, as above).
- The graphics are the Phase 0 proof of concept: scorebug, runs-per-over bars, and the flash. Themed packs come later.
- Stream key and URL live only in the phone's secure storage, never on the server.
- `ET00x` and `ET01x` messages in the app mean: ET008 more than 3 moderators, ET009 demo teams switched off,
  ET010 broadcast already started or ended, ET011 start the match first.
