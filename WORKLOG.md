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
- Splash screen: native splash holds the white ES letters; `AnimatedSplash` starts on the same frame, then the trail and red ball glide in, "EsSports" wordmark (system font) and tagline fade up, progress bar, fade out. Reduced-motion safe.
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
- Native splash is now a blank image on the dark background (no white ES frame); the animated splash fades the letters in. Needs a native rebuild.
- Search screen (`/search`, full screen, opened from the Home search button) built from the design: back button, `SearchField`, `AppTabs` filter pills, grouped results (teams, players, tournaments), recent searches, no-results state. Sample data in `src/features/search/sample-data.ts`; result taps show "coming soon".
- New shared components: `SearchField`, `AppTabs` (generic), `InitialsAvatar` neutral tone, `AppIconTile` border props. Live match card made more compact (smaller text, avatar, chips, spacing).
- Fixed the app staying light while the phone was dark: theme preference now saved under `theme-preference-v2`, old key deleted.
- Dev-only auth bypass (`src/features/auth/dev-bypass.ts`): Log in and Create account skip validation and open Home. Release builds still validate.

**Decisions**
- Hallmark targets web pages, so screens still use the Expo UI skills and theme tokens.
- Design files stay out of GitHub.
- Logo is an original build, not the supplied raster (`use-concepts.png`): that one was low-res, of unknown origin and off-palette.
- Palette: cyan `#19BFFF`, near-black `#0B1410`, light `#F2F5F4`, ball red `#E5243B`, teal `#0E6FA0`.
- App icon is dark ES on light. Splash stays dark, so it uses the reversed (white) mark.
- Theme `primary` is now cyan (was green). Wordmark uses the device system font, no custom font.
- Google and phone login create accounts on first use, so they are not repeated on sign-up.

**Open / next**
- `react-native-svg` is native: rebuild the dev build (`pnpm exec expo run:android` or EAS) before the eye icon works.
- Replace the placeholder terms text with reviewed legal text. Privacy policy screen not built (Play Store needs one).
- No Supabase project or `.env` yet, so login and sign-up show "isn't available right now". Session persistence not set up (`persistSession: false`).
- Phone login needs an SMS provider. Cheapest for Bangladesh is a local provider through the Supabase Send SMS hook (prices not verified).
- Both `package-lock.json` and `pnpm-lock.yaml` exist. `expo-doctor` flags it. Delete `package-lock.json`.
- Delete `dev-bypass.ts` once real auth works. Search, notifications, create sheet, live match and tournament screens show "coming soon" toasts. Welcome screen (mock 02) and "Forgot password?" not built. Native splash and animation not checked on a device.
- Adaptive-icon background in `app.json` was set to `#F2F5F4`.
- Theme switch UI is only on the Profile tab (no Settings screen yet). `userInterfaceStyle` change needs a native rebuild.
- Seam stitches vanish below ~48px. Make a small-size cut if the seam must show at icon size.
- Not checked on a device: adaptive and monochrome icons.
- Logo masters live in gitignored `design/logo/`, so they are not in the repo. Back them up or move them if needed.
- Trademark and reverse-image search not done.
- Commit the staged `design/README.md` removal. It stays in history from commit `5af7f12` until then.
- `bencium-marketplace` is not registered, so its plugin failed to install. Needs `/plugin marketplace add <owner/repo>`.
- UI work starts once designs are in `design/`.

---

## 2026-10-22

**Done**
- Scaffolded the app with `create-expo-app` (Expo SDK 58, RN 0.88, React 19.3, TypeScript strict, Expo Router).
- Removed template demo code and iOS/web parts. Android only.
- Installed: supabase-js, TanStack Query, Zod, FlashList, date-fns, expo-secure-store, expo-updates, expo-build-properties. Dev: jest-expo, Testing Library, Supabase CLI, console-stripping babel plugin. All versions pinned (`.npmrc` `save-exact`).
- Project structure: `src/{app,components/ui,hooks,lib,theme,features/*}`, `supabase/migrations`.
- Config: R8 and resource shrinking, console stripping in production, `runtimeVersion` `appVersion` policy, `eas.json` (development, preview, production), `.env.example`.
- Foundation code: theme tokens, `Text` component, Zod-validated env, Supabase client singleton, query client, root layout, placeholder home screen.
- Checks: `tsc --noEmit` and `expo lint` clean, `expo-doctor` 20/20.

**Decisions**
- Dark-first green theme.
- Auth session persistence deferred to the auth feature (encrypted SecureStore pattern needs `aes-js` and AsyncStorage).

**Open / next**
- `npm audit`: 41 findings, all in Expo's own toolchain. Fix needs `--force`, so left alone.
- Splash hides immediately. Hold it until first data is ready once data exists.
- Not created yet: Supabase project, EAS project, `.env`, Play Store assets.
- Missing skills named in project rules: `vercel-react-native-skills`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`.
- Nothing committed yet.
