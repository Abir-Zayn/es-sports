# TASK-01 report: Privacy Policy screen + Forgot password screen

## 1. Files created / changed

Created:
- `src/features/legal/legal-document-screen.tsx` — shared frame (back button, heading, scrollable sections) extracted from the old `TermsScreen`.
- `src/features/legal/privacy-content.ts` — `privacySections` placeholder: what we collect (email, name, city, playing stats, photo), how it is used, Supabase as processor, sharing (never sold), retention and account deletion, children, contact, changes. `TODO` comment at the top flags it as pending legal review, same approach as `terms-content.ts`.
- `src/features/legal/privacy-screen.tsx` — `PrivacyScreen`, title "Privacy Policy", built on `LegalDocumentScreen`.
- `src/app/privacy.tsx` — thin route.
- `src/features/auth/send-reset-email.ts` — `resetRequestSchema` + `sendResetEmail()` wrapping `supabase.auth.resetPasswordForEmail()`.
- `src/features/auth/forgot-password-screen.tsx` — form and "Check your email" confirmation.
- `src/app/forgot-password.tsx` — thin route.

Changed:
- `src/features/legal/terms-screen.tsx` — now a one-line wrapper over `LegalDocumentScreen`; behaviour identical.
- `src/app/_layout.tsx` — exactly two lines: `privacy` outside the guards (next to `terms`), `forgot-password` inside the `!session` guard (beside `login`/`sign-up`). Left the main agent's other edits in this file untouched.
- `src/features/auth/login-screen.tsx` — "Forgot password?" link under the password field (right-aligned caption, `colors.link`), routing to `/forgot-password`.
- `src/features/auth/sign-up-screen.tsx` — optional part done: the Terms checkbox label now also links "Privacy Policy" (`/privacy`), and its `accessibilityLabel` was updated to match. It fits the existing inline-link layout; no redesign needed.
- `src/features/auth/__tests__/auth-api.test.ts` — added `resetPasswordForEmail` to the supabase mock and three new tests for `sendResetEmail`.
- `WORKLOG.md` — appended to today's **Done** and **Open / next**.

## 2. Decisions / deviations from the brief

- **Lazy-load pattern**: the brief asked to follow the lazy-load pattern in `sign-in.ts`, but the current `sign-in.ts` imports `@/lib/supabase` statically (the client is created at module scope and `env.ts` throws without `.env`). I matched the current code — static import, same as `sign-in.ts`, `sign-up.ts` and `resend-confirmation.ts` — rather than reintroducing a lazy pattern nothing else uses. Tests mock `@/lib/supabase`, so no `.env` is needed there.
- **Non-enumeration lives in `sendResetEmail`**: the result shape stays `{ ok: true } | { ok: false, message }`, so the screen cannot tell error kinds apart. To honour "always show success for a valid email shape, except genuine network or rate-limit errors", the wrapper returns `ok: false` only for rate-limit codes (`over_email_send_rate_limit`, `over_request_rate_limit`, mapped through `auth-errors.ts`) and for thrown/network failures. Every other server response — unknown account included — returns `ok: true`. Trade-off: a genuine server-side failure (e.g. a 5xx while sending) also shows the confirmation. That is the brief's stated policy; flagging it in case the reviewer wants 5xx surfaced too.
- **No `redirectTo` passed** to `resetPasswordForEmail` — deep-link/reset screen is explicitly out of scope, so Supabase uses the project's default redirect URL.
- Schema: exported `resetRequestSchema = z.object({ email: signInSchema.shape.email })` so the form and the API wrapper share the login email rule, mirroring how `resend-confirmation.ts` reuses `signInSchema.shape.email`.
- Used `npx` for validation commands as the brief specified (repo has both `package-lock.json` and `pnpm-lock.yaml`; WORKLOG notes the duplicate-lockfile issue is already known).

## 3. Lint / typecheck / jest output

- `npx tsc --noEmit` — clean (no output).
- `npx expo lint` — clean (only the `env: load .env` lines; no warnings or errors).
- `npx jest`:

```
Test Suites: 11 passed, 11 total
Tests:       62 passed, 62 total
Snapshots:   0 total
Time:        6.362 s
```

New tests cover: invalid email rejected without calling Supabase, success (trimmed email passed through), unknown-account error indistinguishable from success, rate-limit error mapping ("Wait a minute"), and network failure ("connection"). Nothing failed in files I do not own.

## 4. Skipped / follow-ups

- **Reset-password deep link (out of scope, follow-up)**: the emailed reset link needs an app scheme + Supabase redirect URL allow-list entry, an `update-password` screen, and handling of the `PASSWORD_RECOVERY` auth event. Noted in `WORKLOG.md` Open / next.
- **Live behaviour not verified on device**: see below.
- Nothing else skipped — the optional sign-up privacy link was done.

## 5. How I verified

I cannot run a device/emulator, so verification was static plus unit tests:
- Read and matched the reference implementations (`terms-screen.tsx`, `login-screen.tsx`, `resend-confirmation.ts`, `auth-api.test.ts`) so layout, theming, copy style and result shapes are consistent.
- Confirmed the `resetPasswordForEmail` signature against the installed `@supabase/auth-js` typings (`GoTrueClient.d.ts`): `(email, { redirectTo?, captchaToken? })`, returning `{ data, error }`.
- Route registration checked by reading `_layout.tsx` after the edit: `privacy` sits outside the guards next to `terms`; `forgot-password` sits inside the `!session` guard. Expo Router resolves both from the new route files (typecheck passes with typed routes).
- `graphify update .` run after the code changes (graph rebuilt: 3011 nodes, 6273 edges).
- No commits made; all changes are in the working tree.
