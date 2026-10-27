# Claude Guidelines for esSports

> **MANDATORY RULES:** Before writing code, planning tasks, or running commands, you MUST strictly read and follow the **Universal AI Engineering Rules** defined in [memory.md](file:///c:/office-work/esSports/memory.md) and [AGENTS.md](file:///c:/office-work/esSports/AGENTS.md).

### Core Quality Gates (Do Not Skip):
1. **File Length Limit:** Handwritten files must be `<= 200 lines` (Hard limit `270 lines`). Split by domain responsibility.
2. **Zero Fabrication:** Never claim tests passed unless executed. Report `PASS | FAIL | NOT RUN`.
3. **Expo Native Packages:** Always use `npx expo install <package>` for native modules.
4. **Validation Before Done:**
   - Typecheck: `npx tsc --noEmit`
5. **Zero-Crash Render Safety:** Never render raw text/numbers outside `<Text>` (avoid `{count && <View />}` which renders `0` and crashes). Use defensive optional chaining (`?.`), safe style math (no `NaN`), and Error Boundaries.
6. **Compulsory Agent Report:** Provide the 6-point Definition of Done report required in Section 11 of `memory.md`.
