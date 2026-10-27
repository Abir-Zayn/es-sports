# Warp Agent Guidelines for esSports

> **MANDATORY RULES:** Before writing code, planning tasks, or running commands, you MUST strictly read and follow the **Universal AI Engineering Rules** defined in [memory.md](file:///c:/office-work/esSports/memory.md) and [AGENTS.md](file:///c:/office-work/esSports/AGENTS.md).

### Quick Enforcement:
- Max file length: `<= 200 lines` (Hard cap `270 lines`).
- Zero hallucinated test passes.
- Use `npx expo install` for Expo/native modules; `pnpm add` for dev/pure JS utils.
- Run `npx tsc --noEmit` and `npx expo lint` before declaring done.
- Zero-Crash Render Safety: No bare text/numbers outside `<Text>`, use defensive optional chaining (`?.`), and wrap screens in Error Boundaries.
- Follow Definition of Done report format in Section 11 of `memory.md`.
