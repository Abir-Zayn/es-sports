# Multi-Agent Automated Quality Gate CLI Specification (`npm run check:all`)

> **Target Agent:** Warp CLI  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `scripts/verify-all.js` and `package.json`. No front-end screen conflicts.

---

## 1. Executive Summary & Purpose

With multiple autonomous AI agents (Google Antigravity, Claude, Codex, Warp) contributing to the `esSports` codebase simultaneously, the repository requires an **Automated Multi-Agent Quality Gate Runner**.

Instead of running 5–6 different terminal commands manually, any agent or developer can run a single command:
```bash
npm run check:all
```
This tool executes all mandatory compliance gates defined in `memory.md`, outputs a beautiful colored terminal summary table, and exits with code `0` on success or code `1` if any gate fails.

---

## 2. Six Quality Gates to Audit

### Gate 1: File Length Audit (`memory.md §3`)
* **Target:** `<= 200 lines` per handwritten code file.
* **Hard Ceiling:** `270 lines` (Hard failure).
* **Scope:** Recursively inspect all `.ts` and `.tsx` files in `src/`.
* **Exclusions:**
  - Test files (`*.test.ts`, `*.test.tsx`, `__tests__/**`).
  - Sample / fixture data (`sample-*.ts`).
  - Type declaration files (`types.ts`, `database.types.ts`).
  - Zod / validation schemas (`*schema.ts`).
* **Reporting:** Lists files exceeding 200 lines (Yellow warning) and files exceeding 270 lines (Red error).

### Gate 2: Zero-Crash Render Safety Check (`memory.md §5`)
* **Rule:** In React Native, `{count && <Component />}` evaluates to `0` and crashes Android with:
  > `Error while updating property 'text' in RCTTextView` or raw text in `RCTView`.
* **Check:** Regex scan of `.tsx` files in `src/` to flag potential patterns:
  - e.g. `{*\w+ && <[A-Z]` where `\w+` is a numeric counter without a boolean/ternary guard like `> 0 ?` or `Boolean(...)`.
* **Reporting:** Flags line numbers and suggestions to convert to ternary `{count > 0 ? <Component /> : null}`.

### Gate 3: TypeScript Typecheck (`memory.md §4`)
* **Command:** `npx tsc --noEmit`
* **Expectation:** Must exit with code `0` and zero type errors.

### Gate 4: Expo Linting (`memory.md §4`)
* **Command:** `npx expo lint`
* **Expectation:** Must exit with code `0` and zero warnings/errors.

### Gate 5: Jest Test Suite Runner (`memory.md §4`)
* **Command:** `npx jest --watchman=false`
* **Expectation:** All test suites and unit tests must pass. Parse and display:
  - Total test suites passed.
  - Total tests passed.

### Gate 6: Graphify Knowledge Graph Sync (`AGENTS.md`)
* **Command:** `graphify update .`
* **Expectation:** Rebuilds AST code graph topology to keep graph current.

---

## 3. Terminal Output Design & UI Specification

`scripts/verify-all.js` should use standard Node.js ANSI escape colors without external dependencies:

```text
======================================================================
              esSports Multi-Agent Quality Gate Runner
======================================================================

[1/6] Auditing File Lengths (Cap: <= 200 lines)...          [ PASS ] (0 violations)
[2/6] Auditing Zero-Crash JSX Render Safety...              [ PASS ] (Safe)
[3/6] Running TypeScript Typecheck (tsc --noEmit)...       [ PASS ] (0 type errors)
[4/6] Running Expo Linter (expo lint)...                   [ PASS ] (0 lint warnings)
[5/6] Running Jest Test Suites (jest)...                   [ PASS ] (60/60 suites passed)
[6/6] Updating Graphify Knowledge Graph...                 [ PASS ] (Synced)

======================================================================
                         VERIFICATION SUMMARY
======================================================================
 Gate                            | Status    | Duration
---------------------------------+-----------+----------
 1. File Length Budget (<=200)   | PASS      | 0.12s
 2. Zero-Crash Render Safety     | PASS      | 0.08s
 3. Strict TypeScript (tsc)      | PASS      | 6.21s
 4. Expo Linter (lint)           | PASS      | 4.10s
 5. Jest Automated Tests         | PASS      | 9.85s
 6. Graphify Knowledge Graph     | PASS      | 4.50s
---------------------------------+-----------+----------
 Total Quality Gate Status: ALL PASS (24.86s)
======================================================================
```

---

## 4. Implementation Steps for Warp CLI

1. **Create `scripts/verify-all.js`:**
   - Use built-in Node.js modules: `fs`, `path`, `child_process`.
   - Support optional flags:
     - `--quick`: Skips jest and runs fast checks (file lines, JSX safety, tsc, lint).
     - `--fix`: Runs lint auto-fix.
2. **Wire Script in `package.json`:**
   Add under `"scripts"`:
   ```json
   "check:all": "node scripts/verify-all.js",
   "check:quick": "node scripts/verify-all.js --quick"
   ```
3. **Run & Verify:**
   - Run `npm run check:all` in the terminal.
   - Verify that it outputs the colored summary and exits with code 0.

