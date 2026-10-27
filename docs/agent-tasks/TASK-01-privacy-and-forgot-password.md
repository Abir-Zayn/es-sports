# TASK-01: Privacy Policy screen + Forgot password screen

Assigned to: Warp agent. Reviewer: main agent (Claude Code). Parallel to the User Profile design/build, so file ownership below is strict.

## Context

Expo / React Native app, Expo Router, routes in `src/app/`, feature code in `src/features/<name>/`. **Read `AGENTS.md` first** and follow it (check `expo` major version in `package.json`, fetch the matching versioned docs before touching Expo APIs, use `npx expo install` for packages, never edit `ios/` or `android/`). Theme tokens only (`src/theme`), no hard-coded colours. Match the surrounding code style and comment density. Read `WORKLOG.md` for decisions.

Reference implementations to copy structure from:
- `src/features/legal/terms-screen.tsx`, `terms-content.ts`, `src/app/terms.tsx` (Privacy screen mirrors these).
- `src/features/auth/login-screen.tsx`, `auth-layout.tsx`, `auth-switch-link.tsx`, `sign-in.ts`, `auth-errors.ts`, `__tests__/auth-api.test.ts` (Forgot password mirrors these).

## Part A: Privacy Policy screen

Why: Google Play requires a privacy policy; Settings (built by the main agent) will link to `/privacy`.

Do:
1. `src/features/legal/privacy-content.ts`: `privacySections` array shaped like `termsSections` (`{ title, body }`). Generic **placeholder** text covering: data we collect (email, name, city, playing stats, photo), how it is used, Supabase as processor, sharing (none sold), retention and account deletion, children, contact, changes. Add a visible first section or note flagging it as placeholder pending legal review (same approach as terms).
2. `src/features/legal/privacy-screen.tsx`: same layout as `TermsScreen`, title "Privacy Policy". Prefer extracting a small shared `LegalDocumentScreen` (title + sections) that both Terms and Privacy use, rather than copy-pasting; keep Terms behaviour identical.
3. `src/app/privacy.tsx`: thin route, like `src/app/terms.tsx`.
4. Register `<Stack.Screen name="privacy" />` in `src/app/_layout.tsx` **outside** the protected guards, next to `terms` (it must be reachable signed in and out).
5. On the sign-up screen, the Terms checkbox label may also link "Privacy Policy" (only if it fits the existing layout cleanly; skip if it needs a redesign, and say so in your report).

## Part B: Forgot password screen

Why: login has no recovery path; WORKLOG lists "Forgot password?" as open.

Do:
1. `src/features/auth/forgot-password-screen.tsx` + `src/app/forgot-password.tsx` route. Single email field (zod email validation, same pattern as login), primary button "Send reset link", back link to login via `AuthSwitchLink`. Use `AuthLayout`.
2. `src/features/auth/send-reset-email.ts`: calls `supabase.auth.resetPasswordForEmail(email)`. Follow the lazy-load pattern used in `sign-in.ts` (the Supabase client throws without `.env`), return the same `{ ok: true } | { ok: false, message }` result shape, map errors through `auth-errors.ts`.
3. Success state: replace the form with a confirmation ("Check your email") that **does not reveal whether the account exists** (always show success for a valid email shape, except genuine network or rate-limit errors).
4. Double-submit guard (ref + loading), like `logOut()` / sign-in. Disable the button while loading.
5. Add a "Forgot password?" link under the password field on `login-screen.tsx` routing to `/forgot-password`.
6. Register `<Stack.Screen name="forgot-password" />` inside the `!session` guard in `src/app/_layout.tsx`, beside `login` / `sign-up`.
7. Unit tests in `src/features/auth/__tests__/` for `send-reset-email` (success, error mapping, network failure) following `auth-api.test.ts`.

Explicitly **out of scope**: the reset-password screen and deep-link handling for the email link (needs app scheme + Supabase redirect URL setup). Note it as a follow-up in your report.

## File ownership (do not touch anything else)

You may create or edit only:
- `src/features/legal/**`
- `src/app/privacy.tsx`, `src/app/forgot-password.tsx`
- `src/features/auth/forgot-password-screen.tsx`, `send-reset-email.ts`, `login-screen.tsx` (link only), `sign-up-screen.tsx` (privacy link only, optional), `auth-errors.ts` (only if a new message is needed), `__tests__/`
- `src/app/_layout.tsx`: **only** the two `Stack.Screen` lines above. The main agent also edits this file later; keep your diff to those lines.
- `WORKLOG.md`: append a bullet to the existing "Done" list and any new items to "Open / next".

**Do not touch:** `src/app/(tabs)/**`, `src/features/profile/**`, `src/features/scoring/**`, `src/components/ui/**` (if you need a new shared UI piece, build it inside your feature folder and tell me), `src/theme/**`, `package.json` (no new dependencies expected).

## Rules

- No commits, no pushes. Leave changes in the working tree. The repo already has other uncommitted work; do not stage or revert files you did not create.
- Run before reporting: `npx expo lint`, `npx tsc --noEmit`, `npx jest`. All must be clean for your files; if something fails in files you do not own, report it, do not fix it.
- Run `graphify update .` after code changes.

## Report back (write it to `docs/agent-tasks/TASK-01-report.md`)

1. Files created / changed (list).
2. Decisions and anything you deviated from the brief on, with reason.
3. Lint, typecheck and jest output summary (paste the final lines).
4. Anything skipped or follow-ups (reset-password deep link, sign-up privacy link if skipped).
5. How you verified behaviour (you cannot run a device; say what you did check).

The main agent will read the report and review the diff against this brief.

## Acceptance criteria

- `/privacy` opens from a signed-out and a signed-in state and shows the placeholder policy; Terms screen unchanged in behaviour.
- `/forgot-password` validates email, calls Supabase through the lazy pattern, shows non-enumerating success, handles errors, guards double submit.
- Login shows a "Forgot password?" link.
- Both routes registered in the correct guard group.
- New tests pass; lint and typecheck clean.
