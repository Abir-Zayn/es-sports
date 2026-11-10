# Live streaming test guide: a 4-team tournament with two devices

Updated 2026-11-10 for the new roles. Everything here is **untested on a device**. The SQL passes its tests on a WASM
Postgres with stubbed Supabase schemas, the app code has unit tests, and the migrations are applied to the project, but
nothing has run on a phone yet. Expect to find bugs.

## The roles (decided 2026-11-10)

- **There is no team owner.** The tournament **owner** and the **moderators** create teams, invite players and run squads.
- A tournament has **at most 2 moderators** (the owner is separate). The first moderator to accept **streams**, the second
  **scores**. With one moderator, that person does both. The owner can change this (Teams tab, Add teams: the *Streams* and
  *Scores* buttons on each moderator).
- The owner schedules and starts matches but **does not score or stream**. A match cannot start until a moderator has the
  scoring duty. A single moderator who streams is made the match's streamer automatically.

## What you need

| Thing | Notes |
| --- | --- |
| Real Android phone | The **streamer** (moderator 1). Needs 4 GB RAM or more, a rear camera, Android 9+. |
| Genymotion emulator | The **scorer** (moderator 2). It cannot stream (no hardware encoder), which is fine. |
| Three esSports accounts | **Owner**, **streamer**, **scorer**. Email login works everywhere. |
| A Facebook account | To create the live video and copy its **Server URL** and **Stream key**. |
| The `streaming-test` APK | Installed on both. Built from branch `feat/live-broadcast-moderator` (see below). |

## Already done on the Supabase project

Migrations through `20261110060000_disband_deletes_team` are applied, and `app_flags.demo_data` is **on** (turn it off after
testing: `update public.app_flags set enabled = false where key = 'demo_data';`).

## The test, step by step

1. **Emulator, as the owner:** create a tournament: **4 teams**, **start date today**, a short format, 6 a side.
2. **Teams tab:** under *Testing tools* tap **Fill with demo teams** (four teams with full squads). Or create teams by hand
   (Add teams, Create team) and invite real players with **Invite players**.
3. **Add teams, invite moderators:** invite the **streamer** account first and the **scorer** account second.
4. **Real phone (streamer account):** accept the invitation in Notifications. **Then the emulator (scorer account)** accepts
   (log out of the owner account and log in as the scorer, or use a second browser session). Accept order decides the duties.
   Check on the owner's Add teams screen: the first moderator shows *Streams: on / Scores: off*, the second the reverse.
5. **As the owner:** Matches tab, **Create schedule** (auto), publish, with a match **today**.
6. **Start the match** (the owner, or either moderator): the Matches tab shows **Start match N**. Tap **Auto-pick both XIs**.
   The scorer is the scoring moderator, chosen automatically. Start it.
7. **Real phone (streamer):** the dashboard card says *Live now* and **Go live on Facebook**. Tap it.
8. **Facebook:** create a live video, choose *Streaming software*, copy the **Server URL** and **Stream key**.
9. **Real phone:** paste both and tap **Go live**. Check Facebook, then press **Go live** there too.
10. **Emulator (scorer):** open the match scorer and score balls. The scorebug in the stream should update within seconds,
    with FOUR / SIX / WICKET flashes.
11. **Real phone:** **End broadcast**. The match tile should stop saying *LIVE on Facebook*.
12. **Clean up:** Teams tab, **Remove demo teams** (refused while teams still have scheduled matches).

## Things to watch and write down

- Time from **Go live** to video on Facebook, and whether the overlay shows on Facebook (not just the preview).
- Does the overlay stop updating when the screen locks or the app goes to the background?
- Kill the app on the real phone mid-stream. Does the **Resume** card appear when you reopen the console?
- Battery and heat after 10 minutes, and a Wi-Fi to mobile data switch while live.
- Does any other account see *LIVE on Facebook* on the match tile?

## Known limits (by design, for now)

- **Facebook only, Android only.** Streaming from the emulator is not possible.
- The graphics are the Phase 0 proof of concept: scorebug, runs-per-over bars and the flash.
- The stream key and URL live only in the phone's secure storage, never on the server.
- Error codes: ET008 more than 2 moderators, ET009 demo teams switched off, ET010 broadcast already started or ended,
  ET011 start the match first, ET012 the scorer must be a moderator with the scoring duty.
- Old team-owner data was deleted on 2026-11-10 (owner and admin team rows, all team-owner invitations); players were kept.
