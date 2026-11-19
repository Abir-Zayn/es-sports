# Release Pipeline (mandatory for every agent and human)

The app is not on the Play Store. Users install the **production APK** and receive everything after that as
over-the-air (OTA) updates. These rules guarantee every user runs exactly what is on `main`.

## How a release happens

Merge a PR into `main`. That's it. `.eas/workflows/release.yml` runs on EAS:

1. **Fingerprint** the native side of the project (native deps, config plugins, `app.json` native fields).
2. **A production build with that fingerprint exists?**
   - **Yes (JS-only change)** → publish an OTA update to the `production` channel. Installed apps download it in the
     background and run it on the next launch.
   - **No (native change)** → build a new production APK. Distribute the build link from expo.dev to users; they
     install it once, then OTA resumes.

`runtimeVersion` uses the `fingerprint` policy, so an OTA update only reaches APKs with matching native code.

## Rules

1. **Users only get `main`.** Never run `eas build --profile production` or `eas update --channel production` from a
   local checkout, a feature branch, or a dirty tree. EAS uploads whatever is on disk — that is how features went
   missing before.
2. **One channel for users: `production`.** The only build profiles are `development` (dev client, for engineers)
   and `production` (users). Do not re-add `preview` or create ad-hoc profiles/channels for user builds.
3. **Do not change** `runtimeVersion`, `updates`, the `production` profile in `eas.json`, `.fingerprintignore`, or `.eas/workflows/` without
   the owner's explicit approval in the PR.
4. **Native change = new APK.** Adding a native package (`npx expo install …`), a config plugin, permissions, icons,
   splash, or `android.*` in `app.json` produces a new fingerprint. Say so in the PR description so the owner knows a
   new APK must be distributed.
5. **Do not use** `eas update --branch production` to hotfix. Fix it in a PR and merge; the pipeline publishes.
6. **Secrets stay in EAS env vars** (`production` environment). Never commit `google-services.json` or keys.
7. **Emergency only, owner-approved:** a manual build must come from a clean checkout of `origin/main`
   (`git status` empty, `HEAD == origin/main`) and the agent must report the commit hash it built.

## Where users get the app

Latest production APK: expo.dev → abirzayn → esSports → Builds → filter profile `production` → newest finished build.

## Checklist for agents before finishing a PR

- [ ] Does this PR change native code (rule 4)? State it in the PR description.
- [ ] No edits to release config (rule 3) unless approved.
- [ ] No `eas build`/`eas update` run against `production` from your machine (rule 1).
