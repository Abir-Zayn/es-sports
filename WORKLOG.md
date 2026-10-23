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

**Decisions**
- Hallmark targets web pages, so screens still use the Expo UI skills and theme tokens.

**Open / next**
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
