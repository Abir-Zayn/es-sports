# esSports

Multi-tenant cricket tournament platform. Pilot: HSF Premier League. Android only.

**Stack:** React Native + Expo SDK 58 (TypeScript strict, Expo Router), Supabase (Postgres, Auth, Realtime, Edge Functions), TanStack Query, EAS Build/Update.

---

## 📱 Download Android APK (Client Preview)

> [!IMPORTANT]
> **Latest Build:** `v1.0.0-preview.2` (EAS Cloud Build `#63229964-0ed0-4318-88c3-02c21da9dfcf`)  
> **Backend:** Supabase live database connected (`tedgyfczmqqnwrlucsoc`)  
> **Updates:** Over-the-air updates enabled on the `preview` channel. If you installed `v1.0.0-preview`, install this build once; later fixes arrive automatically.

- **Direct APK Download:** [Download esSports-v1.0.0-preview.2.apk (GitHub Release)](https://github.com/Abir-Zayn/es-sports/releases/download/v1.0.0-preview.2/esSports-v1.0.0-preview.2.apk)
- **GitHub Release Page:** [GitHub Releases - v1.0.0-preview.2](https://github.com/Abir-Zayn/es-sports/releases/tag/v1.0.0-preview.2)
- **Expo Hosted Build:** [Expo EAS Artifacts](https://expo.dev/accounts/abirzayn/projects/esSports/builds/63229964-0ed0-4318-88c3-02c21da9dfcf)

### Installation Note:
1. Open the [Direct APK Download Link](https://github.com/Abir-Zayn/es-sports/releases/download/v1.0.0-preview.2/esSports-v1.0.0-preview.2.apk) on your Android device.
2. Tap the downloaded `.apk` file and tap **Install** (allow "Install from unknown sources" if prompted by your browser). It installs over the previous preview.
3. Open **esSports** and sign in or sign up with any email & password.

---

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

### Password recovery

From **Log in → Forgot password?**, enter the account email, open the newest reset email on the device with esSports installed, and choose and confirm a new password (at least eight characters). After saving, tap **Continue** to enter the app. The request screen offers a resend after 60 seconds and allows correcting the email address. Unknown accounts receive the same confirmation. Invalid or expired links offer a fresh request; connection failures allow retrying.

Required hosted Supabase configuration (app changes do not apply these settings):

- Under **Authentication → URL Configuration → Redirect URLs**, allow the exact URL `essports://reset-password`. The existing app scheme handles this in development and production builds. Use an installed build for email-link testing, rather than Expo Go.
- Under **Authentication → Email Templates → Reset Password**, retain a link using `{{ .ConfirmationURL }}` so Supabase verifies the one-time recovery token before redirecting into the app. Keep the client's existing implicit flow; the callback expects a `type=recovery` fragment with access and refresh tokens. Do not substitute the Site URL or a plain redirect URL for the confirmation link.
- Configure a production SMTP sender and verify delivery and rate limits. Email confirmation may remain disabled; password recovery still requires email delivery. If web support is enabled later, also allow its exact `/reset-password` URL.

The reset route stays available during session establishment so signing in from the recovery link cannot redirect past the password form. It removes the fragment from navigation after verification and checks the authenticated user with Supabase before saving. Tokens and passwords are never logged. Supabase HTTP requests have a 20-second timeout and release their abort listeners and timers after completion.

Manual release check: request a real email; open it with the app closed and again while it is running; change the password; sign out; confirm the old password fails and the new password succeeds. Also check an expired/used link, offline retry, resend cooldown, and opening a link while another account is signed in.

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

### Shipping an over-the-air (OTA) update

Builds from `v1.0.0-preview.2` onward check the `preview` channel for updates. Older APKs (`v1.0.0-preview`) cannot receive updates and must install a newer APK once.

Use OTA only when **all** of these hold:

- Only JavaScript/TypeScript, images or other assets changed.
- No package with native code was added, removed or upgraded (anything installed with `npx expo install` that has Android code).
- `version` in `app.json` is unchanged (it sets `runtimeVersion`, so a new version needs a new APK).

Steps:

1. `pnpm typecheck`, `pnpm lint` and `pnpm test` all pass on `main`.
2. `npx eas-cli@latest update --channel preview --environment preview --message "<what changed>"`
   The EAS `preview` environment must contain `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`; without them the update fails at startup. `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is optional. The `eas.json` build `env` block does not supply variables to updates.
3. On a phone with the current APK, close and reopen the app twice; the update loads on the next launch after it downloads.
4. If the update misbehaves, roll back with `npx eas-cli@latest update:rollback` (or republish the previous commit).

Anything else (a native package, app permissions, `app.json` plugin changes, a new `version`) needs a new APK: `npx eas-cli@latest build -p android --profile preview`, then a new GitHub release and README link.
