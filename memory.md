# Universal AI Engineering Rules & Repository Memory
**Target Assistive Agents:** Google Antigravity, Claude Code, OpenAI Codex, Warp Agent, Cursor.
**Scope:** Mandatory engineering defaults for `esSports` and all TypeScript/JavaScript codebases. Treat these as absolute constraints unless explicit user instructions state otherwise.

> [!IMPORTANT]
> **Zero Fabrication Policy:** Never claim tests or checks passed unless they were actually executed in the current session. Report commands, outputs, and status accurately (PASS / FAIL / NOT RUN).

---

## 1. Operating Protocol
- **Before Any Changes:** Inspect `package.json`, lockfile, framework configs, existing architecture, test suites, git status, and adjacent conventions. Follow the repository's actual tools and scripts; never invent scripts or file paths.
- **Impact Assessment:** Identify affected feature boundaries, data flow, asynchronous lifetimes, security implications, low-end device constraints, and test scope before writing code.
- **Minimal & Surgical Changes:** Prefer the smallest maintainable change. Reuse existing abstractions. Never refactor unrelated code or introduce new third-party dependencies without explicit technical justification.
- **Execution Lifecycle:** For nontrivial tasks: briefly plan, implement, validate, inspect `git diff`, and report. Do not conceal failures or claim success without concrete terminal evidence.
- **Destructive Operations Prohibited:** Do not overwrite user edits, delete files indiscriminately, modify secrets/environment files, force-push, merge, release, or deploy without explicit authorization.

---

## 2. Architecture: Feature-First FSD (Feature-Sliced Design)
- **Layered Structure:** Use Feature-Sliced Design where appropriate: `app` (routes/screens) → `widgets` → `features` → `entities` → `shared`. Adopt only the layers strictly needed by the project.
- **Strict One-Way Dependencies:** Higher layers may import lower layers; lower layers must never import higher layers. Avoid cross-slice imports except through explicit public APIs and shared contracts.
- **Public API Encapsulation:** Each slice exports a deliberate public interface (e.g., `index.ts`). Never deep-import private internals of another slice.
- **Responsibility-Driven Colocation:** Group code by domain responsibility, not file type alone. Keep platform integration, domain logic, state, UI, networking, and persistence clearly decoupled.
- **Decentralized State:** Do not centralize every concern into a monolithic service or global store; prefer colocated feature state and explicit dependency injection/props.
- **No Premature Abstraction:** Check for existing reusable patterns first. Do not generalize code before having at least 3 concrete use-cases.

---

## 3. Module Size, Readability & TypeScript Quality
- **File Length Budgets:**
  - **Target:** `<= 200 lines` per handwritten code file.
  - **Hard Ceiling:** `270 lines` (excluding blank lines and comments if project lint permits). Split files by actual domain responsibility, not arbitrary slices.
- **Exceptions:** Machine-generated files, schemas, type declarations, test fixtures, and framework boilerplate must be explicitly documented and excluded from length audits.
- **Strict TypeScript:**
  - Strict type checking enabled at all times.
  - No `any` without narrow, documented justification.
  - No `@ts-ignore` to bypass correctness (use `@ts-expect-error` with an explanatory comment only if strictly unavoidable).
  - No unused imports, unused variables, or dead code.
- **Explicit Contracts:** Make contracts and failure states clear and typed. Validate untrusted external data at API/network boundaries. Avoid magic numbers/constants and duplicated business logic.
- **No Placeholders:** Deliver complete implementations. No `TODO`, `FIXME`, or stub functions for required deliverables.

---

## 4. Package Management & Quality Gates
- **Package Manager Protocol:**
  - Respect `packageManager` and `pnpm-lock.yaml`. Use `pnpm` exclusively in pnpm repositories with frozen lockfiles (`--frozen-lockfile`) in CI.
  - **Expo Exception:** In Expo/React Native projects, ALWAYS use `npx expo install <package>` for native modules to resolve SDK-compatible versions. Use `pnpm add` only for pure JS/dev utilities.
- **Standardized Quality Scripts:** Validate against project scripts (`lint`, `typecheck`, `test`, `build`).
- **Standard Quality Gate:**
  1. `npx tsc --noEmit` (Zero type errors)
  2. `npx expo lint` / `pnpm lint` (Zero warnings)
  3. Automated tests for affected modules
- **Integrity Rule:** Never silence failures with `|| true`, disable lint rules merely to pass, suppress compiler errors, lower coverage thresholds, or fake execution outputs.
- **Missing Scripts:** If a verification command is missing or execution is blocked, report exactly why and explicitly mark the check as **NOT RUN**.

---

## 5. Mobile Performance & Render Crash Immunity (Zero-Crash Rendering)
- **Zero-Crash Render Safety (CRITICAL):**
  - **No Bare Text Outside `<Text>`:** NEVER render raw strings, numbers, or falsy values outside React Native `<Text>` components. Avoid `{count && <Component />}` because if `count` is `0`, React Native renders `"0"` into `<View>` and crashes the app immediately. ALWAYS use `{Boolean(count) && <Component />}` or ternary `{count > 0 ? <Component /> : null}`.
  - **Defensive Data Access:** Always use optional chaining (`data?.user?.profile?.name`) and nullish coalescing (`?? ''` or `?? 0`) when accessing remote, cached, or async data. Never assume nested objects or arrays are non-null during render.
  - **Safe Style Calculations:** Dimensions, flex values, margins, paddings, and font sizes must NEVER resolve to `NaN`, `null`, or `Infinity`. Always guard division or dynamic calculations (e.g., `width: isNaN(val) ? 0 : Math.max(0, val)`).
  - **Error Boundaries:** Use React Error Boundaries (or Expo Router `ErrorBoundary` export) around major features, widgets, and root layout so an isolated render error in one component displays a fallback UI instead of crashing the entire application.
  - **Strict Rules of Hooks:** Never call hooks conditionally, inside loops, or after an early `return`.
  - **Stable Unique Keys:** Every item rendered in a list (`FlatList`, `.map()`) MUST have a unique, stable string/numeric key. Never use array index as a key for dynamic, re-orderable, or mutable lists.
  - **No Unhandled Parsing in Render:** Never call unhandled `JSON.parse()`, complex regex, or unparsed `Date` formatting directly in the component render body. Wrap in `try/catch`, utility functions, or `useMemo` with safe fallbacks.
- **Performance First:** Optimize startup time, Time-to-Interactive (TTI), memory footprint, input responsiveness, battery usage, and 60fps smooth scrolling before adding visual polish.
- **UI Thread Safety:** Prevent unnecessary re-renders, heavyweight libraries, excessive context subscriptions, and synchronous heavy computation on the UI/JS thread.
- **List & Media Virtualization:**
  - Virtualize long lists (`FlashList` or `FlatList` with optimized windowing).
  - Paginate or incrementally fetch remote data.
  - Memoize (`useMemo`, `useCallback`, `React.memo`) only after identifying actual re-render churn.
  - Use transform- and opacity-first animations; respect system reduced-motion settings.
- **Asset & Cache Hygiene:** Compress and dynamically size images; cache deliberately with bounded storage and eviction; prevent cache stampedes.
- **Device Stress Testing:** Consider behavior on slow CPUs, constrained RAM (2GB–3GB), low-bandwidth/throttled networks, offline transitions, rapid multi-taps, app background/foreground switches, and cold starts. Do not make unmeasured performance claims.

---

## 6. Asynchronous State, Cleanup & Memory Leak Prevention
- **Explicit Ownership:** Every subscription, timer (`setTimeout`/`setInterval`), listener, observer, animation, WebSocket, and background worker must have a clear owner and guaranteed cleanup on unmount.
- **Concurrency Guards:** Guard against stale closures, race conditions, out-of-order responses, state updates after component unmount, overlapping mutations, and dangling promises.
- **Cancellation:** Prefer `AbortController` or framework-supported cancellation primitives. Ensure `finally` blocks restore transitional UI states (e.g., loading flags).
- **Rate-Limiting Events:** Debounce high-frequency inputs (search, typing); throttle continuous scroll/layout events. Never debounce critical transactional or authentication mutations.
- **Predictable States:** Model async data explicitly: `idle | loading | success | empty | error | offline`.

---

## 7. Security, Privacy & Compliance
- **Standards:** Follow OWASP Mobile Application Security (MASVS) and principles of least privilege.
- **Cryptographic Integrity:** Use platform-native secure storage (iOS Keychain / Android Keystore via `expo-secure-store`). Never implement custom cryptography.
- **Zero Secrets in Client:** Never hardcode secrets, service-role keys, private tokens, or admin credentials in client code, source repositories, or build snapshots. Public client keys (`EXPO_PUBLIC_*`) are public identifiers, not secrets.
- **Server-Side Authorization:** Enforce ownership and permissions on the server or database policies (Supabase RLS) for EVERY protected mutation; client-side guards are for UX only.
- **Input Sanitization:** Parameterize all database queries. Protect against injection, deep-link hijacking, and insecure deserialization.
- **Data Minimization:** Collect only necessary user data. Redact sensitive details, auth tokens, and credentials from telemetry and logging.

---

## 8. Networking, Storage & Resilience
- **Timeouts & Retries:** Configure finite timeouts for all network calls. Retry only idempotent operations using bounded exponential backoff with jitter.
- **Network Edge Cases:** Gracefully handle no-connection, captive portals, rate limits (429), auth expiration (401/403), server crashes (5xx), and network switching. Prevent infinite request loops.
- **Storage Evolution:** Design database migrations and local cache schemas to be safely forward-compatible and reversible where possible.
- **Write Idempotency:** Prevent accidental duplicate writes using stable request IDs or idempotency tokens.

---

## 9. Testing & Code Review Standards
- **Test Strategy:** Add/update unit tests for core domain logic, integration tests for critical boundaries, and regression tests for every resolved bug.
- **Accessibility (a11y):** Ensure screen reader labels, keyboard/switch navigation focus, minimum 48x48 touch targets, sufficient color contrast, and reduced-motion compliance.
- **Diff Review:** Inspect the complete `git diff` before submission for architectural drift, file length violations, unneeded dependencies, security holes, and accidental edits.
- **Runtime Realism:** Passing static type checks does not prove zero memory leaks or 60fps performance. Profile on actual devices when testing.

---

## 10. Repository Hygiene & Secret Safety
- **No Artifact Pollution:** Never commit session transcripts, AI scratchpads, generated deep-dive dumps, local `.env` files, or build artifacts to version control.
- **Git Hygiene:** Review `.gitignore`, staged files, and git diffs before every commit.
- **Credential Leak Protocol:** If a secret is committed, immediately invalidate/rotate it at the provider. Merely removing it in a subsequent commit does not mitigate the exposure.
- **Production Telemetry:** Must be privacy-compliant, rate-limited, and free of PII, passwords, and authorization tokens.

---

## 11. Compulsory Definition of Done (Agent Report Format)
Every agent completing a task must summarize their work using this exact structure:
1. **Scope:** Files modified, added, or removed, and the technical rationale.
2. **Architecture & File Size:** Confirm adherence to FSD boundaries, public API encapsulation, and verify handwritten files are `<= 200–270 lines`.
3. **Verification Evidence:** Exact commands executed with explicit results (`PASS`, `FAIL`, or `NOT RUN` with reasons).
4. **Safety & Cleanup:** State how component teardown, error boundaries, async cancellation, and race conditions were handled.
5. **Low-End Performance Impact:** State what was reasoned about or measured regarding memory, CPU, or render cost.
6. **Unresolved Risks / Next Steps:** Any known limitations, skipped tests, or required manual device verification.

---

## 12. Precedence & Conflict Resolution
- Repository-specific legitimate requirements and framework correctness always take precedence over generic rules.
- If a rule conflicts with runtime correctness, security, accessibility, or platform guidelines, prioritize correctness and safety, and explicitly document the exception in the final report.
