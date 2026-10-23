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

**Decisions**
- Hallmark targets web pages, so screens still use the Expo UI skills and theme tokens.
- Design files stay out of GitHub.
- Logo is an original build, not the supplied raster (`use-concepts.png`): that one was low-res, of unknown origin and off-palette.
- Palette: cyan `#19BFFF`, near-black `#0B1410`, light `#F2F5F4`, ball red `#E5243B`, teal `#0E6FA0`.
- App icon is dark ES on light. Splash stays dark, so it uses the reversed (white) mark.

**Open / next**
- Splash screen not built yet. In `app.json`: `imageWidth` 76 is too small for the wide mark, and the adaptive-icon `backgroundColor` `#0B1410` no longer matches the light icon background.
- Wordmark "EsSports" not built. Render as text with a loaded font (Barlow Condensed italic is a guess, check against mocks) or outline it for marketing.
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
