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
- Supabase: no project or `.env` yet, so login and sign-up show "isn't available right now". Session persistence not set up (`persistSession: false`). Delete `dev-bypass.ts` once real auth works.
- Phone login needs an SMS provider. Cheapest for Bangladesh is a local provider through the Supabase Send SMS hook (prices not verified).
- Legal: replace the placeholder terms text with reviewed text; build a Privacy Policy screen (Play Store needs one). Trademark and reverse-image search for the logo not done.
- Repo: both `package-lock.json` and `pnpm-lock.yaml` exist and `expo-doctor` flags it. Delete `package-lock.json`. Logo masters live in gitignored `design/logo/`, so back them up.
- Design screens still to build (from the Claude design file): Welcome, phone sign-in, verify code, profile setup, notifications, create sheet; player screens; scorer panel; organizer flow. Also Settings (Appearance picker is on the Profile tab for now) and "Forgot password?".
- Placeholders show "coming soon" toasts: notifications, create, live match, player taps, search results other than teams, the live stream link, sharing a match, the head-to-head team picker and the Stats category chips other than the first (no data for them yet).
- Seam stitches on the logo vanish below ~48px; make a small-size cut if the seam must show at icon size.
