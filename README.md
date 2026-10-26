# esSports

Multi-tenant cricket tournament platform. Pilot: HSF Premier League. Android only.

**Stack:** React Native + Expo SDK 58 (TypeScript strict, Expo Router), Supabase (Postgres, Auth, Realtime, Edge Functions), TanStack Query, EAS Build/Update.

## Getting started

```bash
npm install
cp .env.example .env   # fill in the Supabase publishable key
npx expo start
```

Run on an Android emulator or device with a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (`eas build --profile development`).

### Environment

| Variable | Purpose |
| --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_KEY` | Supabase publishable key (`sb_publishable_...`) |

`EXPO_PUBLIC_*` values are bundled into the app and readable by anyone. Never put `service_role`, payment or admin secrets in the app. Privileged actions run in Edge Functions.

### Authentication

The app connects to the `es-sports` Supabase project (`tedgyfczmqqnwrlucsoc`). Email and password are the only enabled login method. Google and phone login are deferred.

Sign-up validates the email, an eight-character minimum password, matching confirmation and acceptance of the terms. For the current pilot, keep **Confirm email** switched off in Supabase under **Authentication → Sign In / Providers → Email**. Supabase then returns a session on successful sign-up, and the app signs the user in immediately without a confirmation email. This is a hosted project setting; changing app code or pushing to GitHub does not change it.

Sessions persist in encrypted Expo SecureStore on native platforms. Values are chunked below the native size limit, with a manifest committed only after all chunks are written. The app restores the session behind the splash screen and refreshes it while foregrounded. Logging out revokes only the current session, clears its stored credentials and removes cached user queries. All application screens require a session; login, sign-up and terms remain available without one. Route guards protect navigation; database access still requires appropriate Supabase RLS policies.

If email confirmation is enabled again, the app shows confirmation instructions and allows resending from sign-up and login. The hosted email link opens the configured Auth Site URL in the browser; the user then returns to the app to log in. Automatic email-link sign-in and password recovery are separate flows. Configure a reachable Auth Site URL and a production SMTP provider before enabling confirmation for a public release.

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` | Start the dev server |
| `npm run android` | Start and open on Android |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | `expo lint` |
| `npm test` | Jest (`jest-expo`) |
| `npm run doctor` | `expo-doctor` |
| `npm run gen:types` | Generate DB types (needs `SUPABASE_PROJECT_ID`) |

Run typecheck, lint, tests and doctor before calling a task done. Install packages with `npx expo install <pkg>`, and run `npm audit` on dependency changes.

## Project structure

```
src/
  app/              Expo Router routes only
  components/ui/    shared UI (Text, ...)
  features/         auth, tournaments, teams, players, matches, scoring, auction
                    each: api.ts (queries/mutations) + hooks (TanStack Query)
  features/scoring/engine/   pure scoring functions, test-first
  hooks/            shared hooks
  lib/              env (Zod), supabase client, query client
  theme/            design tokens (colors, spacing, radius, typography)
supabase/migrations/   SQL migrations
design/                Claude-created UI designs (local only, gitignored)
```

## Conventions

- Screens never call Supabase directly; go through feature `api.ts` and hooks.
- One Supabase client (`src/lib/supabase.ts`). DB types are generated, never hand-written.
- Style with theme tokens only. Shared widgets (scorecard, wagon wheel, player card, stat tables) are built once and reused.
- Validate external input with Zod.
- Long lists use FlashList. No blur effects. Animate only transform and opacity with Reanimated.
- Clean up every listener, timer and Realtime channel; one channel per live match screen.
- Every scored ball is an idempotent event with a client-generated UUID, queued locally and synced on reconnect. Undo and edit create audited events.
- RLS is on for every table, tenant-scoped, with a test per policy.

## Release

- Release builds enable R8 and resource shrinking (`expo-build-properties`) and strip `console.*`.
- `runtimeVersion` uses the `appVersion` policy. JS-only fixes ship via EAS Update with staged rollout; any native change needs a new store build.
- Profiles in `eas.json`: `development`, `preview`, `production`.
