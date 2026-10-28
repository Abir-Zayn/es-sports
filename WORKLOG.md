# Work log

Daily summary of work done. Newest day first. Add or update the entry for the current day at the end of each session.

Entry template:

```
## YYYY-MM-DD
**Done:** ...
**Decisions:** ...
**Open / next:** ...
```

---

## 2026-10-28

**Start here (next session).** Paste this entry back to Claude. The app is on `main` at `e1d2790` (= `origin/main`). Run it on a phone as a real build, not Expo Go (see "How to run").

**Done**
- **Profile screens**, built from `src/features/profile/DESIGN.md` (no design mock existed, so it follows the app's own design language). Profile tab: header, stat strip, playing style, Personal Info, career with a Bat/Bowl switch, Your Teams, recent performances. Edit profile (`/profile/edit`): photo (add, change, remove), name, area, district, phone, National ID, blood group chips, role as four icon cards (`PlayingRoleOption`, icons in `assets/logo`), batting hand, a "Discard changes?" guard. Bowling style was removed and City became Area and District. National ID shows masked (last 4 digits) on the Profile tab.
- **Settings** (`/settings`): one flush list of icon tiles with hairline dividers and no gaps (Email, Change password, Email sign-in, Google, Notifications, Terms, Privacy, Version) under an "Account" heading, then the System/Light/Dark switch, Log out and Delete account. A cloud button beside "Google: Linked" imports the Google name and photo after a confirm.
- **Supabase profiles**: migration `supabase/migrations/20261028000000_profiles.sql` (applied by the user in the SQL Editor): public `profiles`, owner-only `profile_private` (phone, National ID, blood group), public `avatars` bucket, RLS, and a sign-up trigger that copies the Google name and photo once. Verified from screenshots: 2 profile rows, trigger present, 10 policies. `ProfileProvider` now loads and saves through Supabase (`profile-repository.ts`); stats, teams and recent matches are still sample data. Home greeting and avatar use the saved profile.
- **Native Google sign-in** (`features/auth/google-auth.ts`): `@react-native-google-signin/google-signin` shows the Android account picker and the ID token goes to `supabase.auth.signInWithIdToken`. Works for sign-in and first-time sign-up. The native module is loaded lazily, so Expo Go and old builds show a message instead of crashing; errors include Google's status code. Dev-only `[google-signin]` logs are in place (stripped from release builds). The earlier browser flow (`expo-web-browser`, PKCE, `auth/callback` route) was removed.
- **Account linking**: Settings → Google → Link uses `linkIdentity` with the ID token. It never overwrites an existing name or photo; only blanks are filled. After linking, email/password and Google both open the same account. Google-only accounts have no password.
- **Review of Warp's TASK-01** (Privacy Policy and Forgot password screens) was accepted and pushed. Its report is in `docs/agent-tasks/`.
- **Repo hygiene**: `supabase/` is kept (the migration is the schema source of truth, `.temp/` was already ignored, the empty `.gitkeep` was removed). Rule files `AGENTS.md`, `CLAUDE.md`, `memory.md`, `WARP.md` are committed (small, no secrets). `.codex/`, the 15 ActionBoard folders under `.agents/skills/` and root-level `/*.png` screenshots are in `.gitignore`.
- **Match data (later the same day).** Migration `supabase/migrations/20261029000000_matches.sql` (written, **not yet applied** to the hosted project): `matches` (nullable `tournament_id`, result columns), `match_players` (per-match squad snapshot), `match_scorers`, append-only `ball_events` (undo sets `voided_at`), `can_score_match()` and `void_events_from()`. Anyone signed in reads; only the creator and assigned scorers write. The scorer now saves real balls: `use-match-sync.ts` turns the reducer's audit trail into writes through an ordered, retrying queue; opening a scorer route replays saved events through the reducer to resume; when the chase ends the winner, margin and summary are saved, and undoing that ball reopens the match. Pad badge shows Saved / Saving / Not saved. Reference match stays local. Design: see `src/features/scoring/README.md` ("Saving matches").
- **Tournament → Matches is now a match schedule** (`/tournament/[id]/matches`), built from Mobbin references (FotMob, Apple Sports, theScore) in the app's own style, since the user's reference image did not arrive. Pill filter (All / Live / Upcoming / Results), then Live now, Upcoming and Results. **Upcoming** is split by month heading ("October", "November"; the year is added only when the schedule crosses into another one), and each match is a flat horizontal bar (no card, hairline under each, 4px side padding) from the shared `FixtureTile` in `src/components/match/`: a date circle (day number over weekday) on the left, then "vs" as its own column, then Team 1 name (larger) above Team 2 name (smaller) with no logos, the start time on the right; the hairline starts after the circle (theScore pattern) (ground and match name are only in the accessibility label). **Finished matches** use the same bar under their own month heading: both scores like `176/6(20)` (runs/wickets and overs) in a column beside a thin divider and the start time, with the result line ("Strikers won by 18 runs") below the teams. A live match uses the same bar too: a LIVE badge beside Team 1, both scores with overs (`168/7(20)`, `142/4(16.3)`), no time, and what the chase needs ("Strikers need 27 runs from 21 balls") in the result-line spot. Tapping opens the match as before. `Fixture` now carries `title`, `date` (YYYY-MM-DD) and `day` (replacing `label`), and each side an optional `overs`; the old `FixtureCard`, `FixtureGroupSection`, `FixtureStage` and `FixtureGroup` were removed. Data is still sample data. The bottom-nav Matches tab is still "Coming soon".
- **League points table redone from the FotMob reference** (`/tournament/[id]/table`): one rounded card with a header row (`#`, Team, P, W, L, NR, NRR, PTS), each row a position number, team logo and name (up to two lines), the counts, net run rate and bold points; qualifying teams get a coloured bar on the row's left edge, explained by a legend under the table ("Qualify for semi-finals"). Then simplified on request: no "League stage / After 11 matches" heading, no card (flat, edge to edge via a new `flush` option on `TournamentScreenFrame`) and no "Road to the final" bracket (`road-to-final-section.tsx`, `bracket-connector.tsx` and the title, progress, semis and final data removed). The in-table cut line and the form dots are gone too (`form-dots.tsx` and `PointsRow.form` removed). `PointsRow` gained `noResult` (played = won + lost + no result; win = 2 pts, no result = 1); two sample teams now have a no result so the NR column shows. The rules line under the table stays. Sample data only; NRR is still a stored string, not computed.

**Validation:** `npx tsc --noEmit` PASS, `npx expo lint` PASS (no warnings), `npx jest` PASS (16 suites, 97 tests, including render smoke tests for Settings, Profile and Edit profile). Google sign-in was confirmed on the phone from the user's logs (picker, ID token, Supabase accepted). NOT RUN: a visual check of the final Settings layout on the phone.

**Validation, match data:** `npx jest src/features/scoring` PASS (7 suites, 43 tests: result rules, save-then-replay round trips, row mapping, save queue, provider wiring with mocked storage). The migration was run on an in-memory Postgres (PGlite) with stubbed `auth` and roles: constraints, RLS (creator, other user, assigned scorer, signed-out), column grants and the undo function all behaved as intended. NOT RUN: the migration on the real Supabase project, and the scorer on a phone against it. Full `npx expo lint` and `npx jest` currently also report failures in `src/features/auth/` (reset-password files and `auth-api.test.ts`) that are outside this work.

**GitHub:** pushed `1f4c17a` (profile, settings, privacy, forgot password) and `e1d2790` (Google sign-in, Supabase profiles, Settings rework, rule files, ignore rules). Auth commit `a37221c` went out with the first push.

**Uncommitted on purpose:** the scorer work (`src/app/scorer/`, `src/features/scoring/`), a `match-info-screen.tsx` change, the `scorer/[id]` route line in `src/app/_layout.tsx` (the pushed version leaves it out), the ActionBoard block in the local `AGENTS.md` (the pushed copy leaves it out), and this WORKLOG update. Do not run `git add -A`; stage files by name.

**Decisions**
- Keep the three profile tables and bucket as designed: sensitive fields (phone, National ID, blood group) live in an owner-only table, never in `profiles`.
- Name and photo are copied from Google once at sign-up; after that the profile row is the source of truth and the auth session is never touched by profile edits.
- Native Google sign-in uses the free "Original" library API (the standard Android account chooser). The Credential Manager bottom sheet is the library's paid tier.
- Success messages after linking or importing were removed; only errors show.
- The sign-in email row is labelled "Email", so the Account list has two rows named "Email" (address, and "Connected"). Reconsider the label if it confuses.

**How to run (real build, not Expo Go)**
- Expo Go cannot run the Google module. Install the app on the phone: enable USB debugging, then in PowerShell run `$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"`, `$env:Path += ";$env:ANDROID_HOME\platform-tools"`, `adb devices` (the phone must show as `device`), then `npx expo run:android --device`. Metro: `npx expo start --dev-client`. Rebuild only when a native package is added.
- `.env` needs `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` (the Web client ID, not the Android one). Restart Metro after editing it.
- Google Cloud project number is `839431537303`. It has a Web client (redirect URI is the Supabase `/auth/v1/callback`) and an Android client for `com.essports.app` with the debug SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`. Full steps and troubleshooting: `docs/google-sign-in.md`.
- A `DEVELOPER_ERROR` (code 10) means Google found no Android client matching the package and signing key.

**Open / next (in order)**
1. Look at Settings on the phone (flush list, icons, theme switch above Log out) and say what looks off.
2. Confirm **Allow manual linking** is on in Supabase (Authentication → Sign In / Providers). Linking worked for the user, so it likely is.
3. Change password flow, so Google-only accounts can add a password; then the password-reset deep link (app scheme `essports` plus a Supabase redirect URL, an update-password screen, and `PASSWORD_RECOVERY` handling).
4. Replace the absolute `file:///c:/office-work/...` links in `AGENTS.md`, `CLAUDE.md`, `memory.md` and `WARP.md` with relative links (they break on GitHub and other machines).
5. Before shipping: register the release and Google Play signing SHA-1s on the Android OAuth client, set the three `EXPO_PUBLIC_*` variables in EAS (`.env` is not uploaded), and install `expo-dev-client` if using the `development` EAS profile.
6. Account deletion: a Supabase Edge Function plus `GoogleSignin.revokeAccess()` (Google Play requires an in-app path). The Delete account button only shows "coming soon" today.
7. Real career stats feed for the profile; an unlink-Google button; decide whether to keep the "Account" heading and the two "Email" labels.
8. Apply `20261029000000_matches.sql` in the Supabase SQL Editor (after the profiles migration), score a few balls on the phone, and check `ball_events` and `matches` in the dashboard. Then review and commit the scorer work (screens, engine and the new `data/` layer). It is untracked.
8b. Match data follow-ups: a create-match screen with chosen teams and players (the scorer still uses sample squads), UI to assign extra scorers, offline storage for unsent balls (they live in memory today), a tournaments table that adds the foreign key on `matches.tournament_id`, and spectator screens reading live data.
9. Decide whether `docs/agent-tasks/` (Warp hand-off notes) should stay in the repo.
10. From earlier entries and still open: turn off email confirmation in Supabase if immediate signup is wanted (`mailer_autoconfirm`), replace the placeholder terms and privacy text with reviewed text, confirm the licences of the four SVG Repo role icons before release, and delete `package-lock.json` (the project uses pnpm).

## 2026-10-27

**Done:** Connected email/password login and account creation to the `es-sports` Supabase project (`tedgyfczmqqnwrlucsoc`). Added saved sessions in encrypted SecureStore, foreground token refresh, session restoration behind the splash screen, protected routes, logout, validation and authentication errors. Removed the development auth bypass. The user confirmed that live account creation works. Restored the Google and phone buttons on login; both remain “coming soon” placeholders. Added “Add password” hints to login and both Create Account password fields. Added a placeholder Privacy Policy screen (`/privacy`, shared `LegalDocumentScreen` with Terms so its behaviour is unchanged) and a Forgot password flow (`/forgot-password`): single email field, `resetPasswordForEmail`, non-enumerating confirmation, rate-limit/network errors only, link under the login password field; the sign-up checkbox now also links the Privacy Policy. Lint, typecheck and all 62 tests pass.

**Validation:** Lint, typecheck and all 20 authentication/storage tests passed. Tests cover validation, signup with confirmation enabled or disabled, login, resending, logout, session events and storage failures. Supabase responses are mocked in these tests; the live signup result was reported by the user.

**GitHub:** Password hint commits `f5d3738` and `9ecb5e4` were pushed to `main`. The full authentication implementation is committed locally as `a37221c` and has not been pushed.

**Decisions:** Email confirmation should be disabled for the current pilot so successful signup signs the user in immediately. This requires changing the hosted Supabase Auth setting; the app already handles a session returned on signup. Keep confirmation and resend handling available if the setting is enabled again later.

**Open / next:** At the last live check, email confirmation was still enabled (`mailer_autoconfirm: false`). The connected Supabase tools cannot edit this setting, and the local CLI is signed into a different account. In the project dashboard, open Authentication → Sign In / Providers → Email, switch **Confirm email** off and save. Verify `mailer_autoconfirm: true`, then push `a37221c`, as requested by the user. Verify immediate signup, login, session restoration after restarting the app and logout on a device. Unrelated scorer and local tooling changes remain outside the authentication commit. Password reset follow-up: the reset email has no `redirectTo` yet — build the update-password screen and deep-link handling (app scheme + Supabase redirect URL allow-list) so the emailed link lands in the app. The privacy policy text is a placeholder pending legal review, like the terms.

## 2026-10-26

**Done:** Reviewed the existing Team screens (Overview, Squad, Members, Matches) and match-viewing screens (Live, Scorecard, Overs, Wagon, Info). Their routes and UI are already implemented; data remains sample-based and several actions remain placeholders. Built, installed, and launched esSports on the Pixel_6 emulator. Confirmed the app is the foreground activity and Metro bundled successfully. Lint and typecheck passed.

**Decisions:** Set `ANDROID_HOME` for the launch process. Installed Android NDK 27.1.12297006 and CMake 3.31.6 in the local SDK. Pinned `expo-build-properties.android.cmakeVersion` to `3.31.6` in `app.json` to resolve Ninja's Windows path-length build failure, then regenerated Android through Expo prebuild.

**Scorer UI:** Built the six uploaded scorer references: setup, ball entry, shot direction, wicket entry, end-of-over bowler selection, and stream overlay. Added Expo Router routes under `/scorer/[id]` and an entry from Match Info. Screen files stay below 200 lines and compose focused components. Added local scoring with extras, strike changes, free-hit restrictions, wicket replacement, bowler eligibility, innings/chase completion, idempotent delivery IDs, shot saving, and audited undo. Overlay graphics and colours preview locally. Lint, typecheck, and all 33 tests passed; exercised the scoring flow on Pixel_6 and saved captures in the gitignored `design/scorer/verification/` folder.

**Scorer limits:** Sample squads and session-only drafts; no backend authorization, durable storage/sync, or hosted streaming service. The spectator screens retain sample scores. Expo Doctor passed 18/20 checks and reported the existing duplicate lockfiles and five SDK patch-version mismatches. No dependency versions were changed for the scorer work.

**Open / next:** Exact visual comparison and design screen numbering could not be verified because the Claude artifact was inaccessible. Metro remains running on port 8081. `ANDROID_HOME` was set for this process only; future terminals still need the SDK environment variable configured.

## 2026-10-23

**Done**
- Added `design/` folder for Claude-created UI designs (reference only, not bundled).
- Installed the `hallmark` skill globally (`npx skills add nutlope/hallmark -g`). Linked for Claude Code.
- Tidied `.gitignore`: merged env rules (`.env`, `.env.*`, `!.env.example`), added keystore and credential files, coverage, Windows files, local tooling.
- Rewrote `README.md` for this project.
- Added this `WORKLOG.md`.
- Gitignored `design/` (local only). Untracked `design/README.md` with `git rm --cached` (staged, not committed).
- Read splash references in `design/splash/` (Splash, Welcome).
- Installed the `logo-design` plugin (`kaankiziltug/logo-design-skill`) and designed the app logo with it: an original ES mark (italic E, curved S, tapered trail ending in a red cricket ball with a seam). Built as SVG paths, no live text. Final ink is near-black on light.
- Final app icon is the "On Light" version (`#F2F5F4` background). Replaced `assets/images/`: `icon`, `android-icon-foreground/background/monochrome` (1024), `favicon` (48), `splash-icon` (1024, white reversed ES for the dark splash).
- SVG masters in `design/logo/` (`logo`, `logo-reversed`, icon sources). Removed the earlier concept files. Kept the reference image in `design/logo/reference/`.
- Splash screen: native splash is the plain dark background (blank image); `AnimatedSplash` fades the ES letters in, then the trail and red ball glide in, "EsSports" wordmark (system font) and tagline fade up, progress bar, fade out. Reduced-motion safe.
- Fixed `pnpm start`: set `allowBuilds` in `pnpm-workspace.yaml`. Project is pnpm-only from here (`pnpm exec expo ...`).
- Auth UI: login and sign-up screens (email and password, zod validation, Supabase calls loaded on submit because the client throws without `.env`). Google and phone buttons on login only, both show "Coming soon". "Don't have an account? Create one!" and "Already have an account? Log in" links.
- Sign-up requires accepting the Terms and Conditions (checkbox, `/terms` screen). Terms text is a generic placeholder in `src/features/legal/terms-content.ts`.
- Shared UI in `src/components/ui`: `Button` (primary, secondary, ghost, leading icon), `TextField`, `PasswordField` (lucide eye icon), `Checkbox`. Shared auth frame `AuthLayout`, `SocialOptions`, `AuthSwitchLink`.
- Added `lucide-react-native` and `react-native-svg` (per-icon imports).
- Light and dark theme: palettes in `src/theme/tokens.ts`, `ThemeProvider` with `useTheme` and `useThemedStyles`, System/Light/Dark preference saved in SecureStore, `userInterfaceStyle` set to `automatic`. Appearance picker is on Home for now. Dark-ink logo layers for light mode. Splash stays dark.
- Added reusable `AppIconTile` (terms back button).
- Home screen built from the Claude design file (`Home.dc.html`): header, live match cards, my teams, upcoming fixtures, tournaments to follow, floating bottom nav with raised Create button. Sample data in `src/features/home/sample-data.ts`. Tabs live in `src/app/(tabs)/` (custom bar via `expo-router/ui`); Tournaments and Matches are placeholders, Profile holds the Appearance picker.
- Dark palette now uses the design's exact colours; added tokens (`primarySoft`, `primaryDeep`, `accentSoft`, `dangerSoft`, `onLive`, `outline`, `sizes.gutter`, `sizes.sectionGap`).
- Home refactor: `HomeScreen` now only composes sections in `src/features/home/sections/` (top bar, live, your teams, upcoming, tournaments to follow). Shared `LiveMatchCard`, `TeamScoreRow`, `BallChip` in `src/components/match/`; types in `src/types/cricket.ts`. New reusable `AppBadge` and `AppAvatar` (replaces `TeamBadge`). Live card: badge left, tournament right, "needs x runs" line on top, radius 20, smaller avatar/score/team name. Section headings are now title case, 20px, no italic.
- "Next Games" section (was Upcoming): flat rows split by hairlines, no card or date tile. Shared `UpcomingMatchTile` in `src/components/match/` (type `UpcomingMatch` in `src/types/cricket.ts`); date shows weekday small over "24 Oct" larger.
- Avatars: `InitialsAvatar` (picture if uploaded, else initials on a dark blue or yellow tone; circle or square) used for the top bar user, team avatars (square in Your Teams) and the tournament card logo. Built on `AppAvatar`. Tone type `AvatarTone` lives in the theme.
- Native splash switched to a blank image (removed the white ES frame shown before the splash). Needs a native rebuild.
- Search screen (`/search`, full screen, opened from the Home search button) built from the design: back button, `SearchField`, `AppTabs` filter pills, grouped results (teams, players, tournaments), recent searches, no-results state. Sample data in `src/features/search/sample-data.ts`; result taps show "coming soon".
- New shared components: `SearchField`, `AppTabs` (generic), `InitialsAvatar` neutral tone, `AppIconTile` border props. Live match card made more compact (smaller text, avatar, chips, spacing).
- Tournament overview screen (`/tournament/[id]`, full screen, opened from the Home tournament cards) built from the design: banner header, follow button, section tabs, live match card, standings, top performers, recent results, head-to-head link. Sample data in `src/features/tournament/sample-data.ts`; other tabs and links show "coming soon". New shared `StandingsTable`, `ResultCard`; `Section` and `SectionHeader` moved to `components/ui`; `AppTabs` `outlined` option; `Button` `compact` size.
- Tournament inner screens built from the design (`/tournament/[id]/matches`, `table`, `stats`, `teams`, `head-to-head`); the overview moved to `[id]/index`. Shared `TournamentScreenFrame` (compact header, section tabs) and `useTournamentRoutes` (tabs replace the screen, head to head pushes). Matches: stage filter (new `SegmentedControl`), grouped `FixtureCard`s. Table: `PointsTable` with form dots and a qualification line, "Road to the final" bracket. Stats: batting/bowling switch, podium, leaderboard. Teams: two-column `TeamCard` grid. Head to head: team picker card, win split, stat bars, recent meetings. Sample data in `sample-*.ts` beside them; shared teams in `sample-teams.ts`. Overview "Full table", "All stats", "All matches" and Head to head now navigate.
- Match screens built from the design (`/match/[id]` Live, `scorecard`, `overs`, `wagon`, `info`) in `src/features/match/`. Live: hero with both scores and chase line, stream link, batters/bowler tables, this-over card. Scorecard: innings tabs, batting card (extras, total, yet to bat), fall of wickets, bowling, partnership bars. Overs: runs-per-over bar chart with wicket dots, one card per over. Wagon: batter tabs, shot filters, SVG wheel (geometry in `wagon-geometry.ts`, unit-tested), off/leg split. Info: toss banner, details, stream buttons, squads with playing XI and bench. Shared `StatsTable`, `ChoiceTabs`, sized `BallChip` (empty balls, Lb/B) in `components/match`. `useOpenMatch` opens a match by state (live → Live, result → Scorecard, upcoming → Info); wired from Home live cards, tournament overview and Matches, and head to head meetings. Sample data in `sample-*.ts` (one match for every id).
- Team screens built from the design (`/team/[id]` Overview, `squad`, `members`, `matches`) in `src/features/team/`. Overview: hero in the team colour with follow button, record strip, live match card, form tiles, key players, team info. Squad: match picker with edit button, playing XI and bench as three-column avatar grids with C / WK badges. Members: player and staff counts, Invite player button, role filter, rows with Captain / Keeper / Invited / Manager tags. Matches: played / won / win rate tiles, result filter, match cards. `useOpenTeam` opens a team by its short code; wired from Home team avatars, the tournament Teams grid and team search results. Every id shows the Strikers sample. New `lib/initials.ts` and `lib/chunk.ts` (unit-tested). Added `"types": ["jest"]` to `tsconfig.json`: the match tests did not typecheck before.
- Fixed the app staying light while the phone was dark: theme preference now saved under `theme-preference-v2`, old key deleted.
- Dev-only auth bypass (`src/features/auth/dev-bypass.ts`): Log in and Create account skip validation and open Home. Release builds still validate.
- Pushed to GitHub (`main`): latest commits cover auth screens, theme, Home, search, tournament overview. Removed a stray `filter-tabs.tsx` the editor re-saved after it was deleted.

**Decisions**
- Hallmark targets web pages, so screens still use the Expo UI skills and theme tokens.
- Design files stay out of GitHub.
- Logo is an original build, not the supplied raster (`use-concepts.png`): that one was low-res, of unknown origin and off-palette.
- Palette: cyan `#19BFFF`, near-black `#0B1410`, light `#F2F5F4`, ball red `#E5243B`, teal `#0E6FA0`.
- App icon is dark ES on light. Splash stays dark, so it uses the reversed (white) mark.
- Theme `primary` is now cyan (was green). Wordmark uses the device system font, no custom font.
- Google and phone login create accounts on first use, so they are not repeated on sign-up.
- Screens are built faithfully from the Claude design file, split into section components under `src/features/<name>/sections/`, with shared pieces in `src/components/{ui,match}`. Sample data lives in each feature's `sample-data.ts` until Supabase exists.
- Heading style on built screens: title case, 20px bold, no italic (differs from the design's italic capitals).
- Edit scripts on Windows must write files as UTF-8 (a `·` once got saved in the wrong encoding).

**Open / next**
- Rebuild the native app once (`pnpm exec expo run:android` or EAS): needed for `react-native-svg`, `userInterfaceStyle: automatic`, the blank native splash and the new splash colour. Nothing is checked on a device yet (layouts, keyboard behaviour, adaptive and monochrome icons, splash timing).
- (Outdated: Supabase has been connected since 2026-10-27.) Supabase: no project or `.env` yet, so login and sign-up show "isn't available right now". Session persistence not set up (`persistSession: false`). Delete `dev-bypass.ts` once real auth works.
- Phone login needs an SMS provider. Cheapest for Bangladesh is a local provider through the Supabase Send SMS hook (prices not verified).
- Legal: replace the placeholder terms and privacy text with reviewed text (both are generic drafts). Trademark and reverse-image search for the logo not done. The `/assets/logo` role icons come from SVG Repo: confirm their licences before release.
- Repo: both `package-lock.json` and `pnpm-lock.yaml` exist and `expo-doctor` flags it. Delete `package-lock.json`. Logo masters live in gitignored `design/logo/`, so back them up.
- Design screens still to build (from the Claude design file): Welcome, phone sign-in, verify code, profile setup, notifications, create sheet; player screens; scorer panel; organizer flow. "Forgot password?" request screen is built; the reset link still needs a deep link, an update-password screen and `PASSWORD_RECOVERY` handling (app scheme `essports` plus a Supabase redirect URL allow-list entry).
- Placeholders show "coming soon" toasts: notifications, create, live match, player taps, search results other than teams, the live stream link, sharing a match, the head-to-head team picker and the Stats category chips other than the first (no data for them yet).
- Seam stitches on the logo vanish below ~48px; make a small-size cut if the seam must show at icon size.
