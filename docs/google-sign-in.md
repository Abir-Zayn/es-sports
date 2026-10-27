# Google sign-in, profile sync and account linking (native Android)

## How it works

**Sign in / sign up** (`features/auth/google-auth.ts`, button in `social-options.tsx` on the Login screen)

1. `GoogleSignin.configure({ webClientId })` once, then `GoogleSignin.signIn()` shows the native Android account picker inside the app. No browser.
2. The result carries a Google **ID token**. It is issued for the **Web** client, which is the one Supabase's Google provider checks.
3. `supabase.auth.signInWithIdToken({ provider: 'google', token })` creates the session. The session guard in `_layout.tsx` then navigates.
4. A returning Google user signs in. A first-time Google user gets an account. It is one call, so there is no separate sign-up flow.
5. `GoogleSignin.signOut()` runs first, so the picker always opens and a different Google account can be chosen.
6. Dismissing the picker is silent. Other failures show a message (missing Play services, a misconfigured build, no network).

**New user pre-fill** (`supabase/migrations/20261028000000_profiles.sql`)

- A trigger on `auth.users` creates the profile row once, copying the Google **name** (`full_name` or `name`) and **photo** (`avatar_url` or `picture`, https only). The email is the auth email itself (`session.user.email`) and is not stored twice.
- The trigger never raises: a profile problem must not block sign-up. The app creates the row on first load instead (`fetchProfile`), also for accounts that existed before the migration.

**Editable profile**

- After sign-up the `profiles` row is the source of truth. The app never reads name or photo back from auth metadata, so Google data is not locked in and editing never touches the auth session.
- Edit profile saves to `profiles` / `profile_private`. A picked photo is uploaded to the `avatars` bucket (`<user id>/avatar-<time>.jpg`, old files removed) and its public URL is saved. "Remove" clears it.
- Phone, National ID and blood group live in `profile_private`, owner-only, so other players can never read them.

**Linking Google to an email/password account** (Settings → Google row)

- "Link" picks a Google account the same native way, then calls `supabase.auth.linkIdentity({ provider: 'google', token })`. It never calls `signInWithIdToken`, so no second account is created.
- Linking does not create a user, so the sign-up trigger does not run and the profile is untouched.
- After linking, only **blank** fields are filled from Google (`importFromProvider(..., 'fill-empty')`). A name or photo the player already has is never overwritten.
- A cloud button beside "Linked" on the Google row replaces the name and photo with Google's, only after a confirm dialog (`'overwrite'`).

## One-time setup you must do

### 1. Google Cloud Console (project that owns your Web client)

You already have the **Web application** client (its ID goes in Supabase). Native Android sign-in also needs an **Android** client in the same project, or Google answers `DEVELOPER_ERROR`.

APIs & Services → Credentials → Create credentials → OAuth client ID → **Android**:

- **Package name:** `com.essports.app` (from `app.json`)
- **SHA-1 certificate fingerprint:** one Android client per signing key, or one client with the fingerprint you use. You will likely need all of these over time:
  - **Local debug build** (`npx expo run:android`): `keytool -list -v -keystore android/app/debug.keystore -alias androiddebugkey -storepass android -keypass android` (on Windows `%USERPROFILE%\.android\debug.keystore` if `android/app/debug.keystore` does not exist). Copy the `SHA1:` line.
  - **EAS builds** (development, preview, production): run `npx eas-cli@latest credentials`, pick Android → the build profile → Keystore. It prints the SHA-1. Each profile that uses a different keystore needs its own fingerprint.
  - **Google Play** (after you publish): Play Console → your app → Test and release → App integrity → App signing → **App signing key certificate** SHA-1. Play re-signs your app with this key, so Play-installed builds only work once it is registered. Also add the **upload key** SHA-1 if you test the same build outside Play.
- Nothing from the Android client goes into the app code or Supabase. It only has to exist with the right package name and SHA-1.

OAuth consent screen: while the app is in "Testing", add each tester's Google address under **Test users**, or sign-in is refused.

### 2. App environment

Add the **Web** client ID (it ends in `.apps.googleusercontent.com`; not the secret) to `.env`, and as an EAS environment variable for cloud builds:

```
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=1234567890-abc123.apps.googleusercontent.com
```

Without it the Google button shows "Google sign-in isn't set up yet."

### 3. Supabase

- **Run the migration** `supabase/migrations/20261028000000_profiles.sql` (SQL Editor, or `supabase db push` with the right account). It is not applied yet.
- **Allow manual linking:** Authentication → Sign In / Providers → turn on **Allow manual linking**. Without it, "Link" shows "Linking accounts isn't available right now."
- The Google provider keeps the Web client ID and secret you already added. The ID token's audience is the Web client, so you do not need to list the Android client ID. If Supabase ever rejects the token with a nonce error, turn on **Skip nonce checks** in the Google provider (the free library cannot set a nonce on Android).
- Redirect URLs are no longer needed for Google. There is no browser redirect.

### 4. Rebuild the native app

**Expo Go cannot run Google sign-in.** Expo Go only contains Expo's own native modules, and `@react-native-google-signin/google-signin` is not one of them. In Expo Go the Google button shows "needs the installed esSports app, not Expo Go"; everything else (profile, settings, photo picker, email login) still works there. To use Google sign-in, install your own build of the app on the phone:

```powershell
# 1. Phone: Settings > About phone > tap Build number 7 times > Developer options > USB debugging on. Plug in the phone and accept the prompt.
# 2. PowerShell, in the project folder (the SDK is at %LOCALAPPDATA%\Android\Sdk):
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools"
adb devices                       # the phone must be listed as "device"
npx expo run:android --device     # builds, installs, and starts Metro
```

The installed app replaces Expo Go for this project. After the first build, JS changes reload as usual (`npx expo start --dev-client`); rebuild only when a native package is added.

Your local **debug** SHA-1 (the default Android debug key, used by `expo run:android`): `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`. Register it on the Android OAuth client with package `com.essports.app`. Google can take a few minutes to honour a new fingerprint.

An EAS cloud build is the alternative if USB is not an option, but `eas.json`'s `development` profile needs `expo-dev-client` installed first, and the three `EXPO_PUBLIC_*` variables must be set in EAS (the `.env` file is not uploaded).

## Things to know

- **Same-email accounts:** if someone signed up with email and password and later taps "Continue with Google" with the same address, Supabase links the Google identity to the existing user, so their profile is kept. Only verified emails are linked automatically.
- **Account picker look:** the free "Original" library API opens Google's standard Android account chooser. The Credential Manager bottom sheet ("Universal sign-in") is the library's paid tier; switching later is a contained change inside `google-auth.ts`.
- **Google photo URLs** are hosted by Google and can change. Uploading a photo in the app moves it to our own storage.
- Stats, teams and recent matches on the profile are still sample data.
- No unlink button yet (Supabase needs at least two identities to unlink).
- When account deletion is built, call `GoogleSignin.revokeAccess()` as part of it.
