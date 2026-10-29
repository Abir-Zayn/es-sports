# Real Match Scorecard, Overs & Info Tabs Specification

> **Target Agent:** Claude  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/features/match/` (`match-scorecard-screen.tsx`, `match-overs-screen.tsx`, `match-info-screen.tsx`, and their child components). Do not touch `src/features/players/` or `src/features/search/`.

---

## 1. Executive Summary & Purpose

Claude has successfully built real match data feeds for the **Live** and **Wagon** tabs (`MatchLiveScreen` and `MatchWagonScreen`).
Now, the remaining 3 spectator tabs must be connected to the real match data derived from `use-live-match-data.ts`:

1. **Scorecard Tab (`match-scorecard-screen.tsx`):**
   - Connect Innings 1 & Innings 2 to real scorecards derived from ball events replay.
   - Real Batting Table: Batter name, dismissal (`b Bowler`, `c Fielder b Bowler`, `not out`), Runs, Balls, 4s, 6s, Strike Rate.
   - Extras & Total summary (`64/2 in 6.0 ov`).
   - Real Fall of Wickets (FOW) timeline.
   - Real Bowling Table: Bowler, Overs, Maidens, Runs conceded, Wickets, Economy.
   - Real Partnerships.

2. **Overs Tab (`match-overs-screen.tsx`):**
   - Connect real innings overs from the match.
   - `RunsPerOverChart`: Real runs conceded per over bar heights and wicket badges.
   - `OverCard` list: Real ball-by-ball deliveries with color-coded pills (`4`, `6`, `W`, `.`, extras) and bowler names.

3. **Info Tab (`match-info-screen.tsx`):**
   - Real toss note: Winner and decision (`tossNote: { team: 'Halishahar Strikers', decision: 'bat' }`).
   - Match details: Real format (e.g. `6 overs per side`), date/time, match status.
   - Real squads: Full playing XI and bench for both sides with roles.

---

## 2. Technical Architecture & Data Derivation

In `src/features/match/live/`:
- Extend `deriveLiveMatchData` (or helper `deriveScorecardData`) to output:
  - `innings`: Array of `InningsScorecard` for each innings played:
    - `id`: `'innings-1'` | `'innings-2'`
    - `team`: `{ name, short, tone }`
    - `score`: e.g. `'64/2 (6.0 ov)'`
    - `batters`: Array of batter rows with dismissal, runs, balls, 4s, 6s, SR.
    - `bowlers`: Array of bowler rows with overs, maidens, runs, wickets, economy.
    - `fallOfWickets`: Array of `{ number, runs, wicketScore, batterName, over }`.
    - `partnerships`: Array of `{ runs, balls, batterA, batterB }`.
  - `oversData`: Array of overs with runs, wickets, bowler name, and ball events.
  - `matchInfo`: Real toss winner, format details, and team playing squads.

---

## 3. Strict Quality & Verification Guidelines

1. **File Length Budgets:**
   - Every file must be `<= 200 lines` (Hard limit `270 lines`).
2. **Zero-Crash Render Safety:**
   - No raw string or number outside React Native `<Text>`.
3. **Verification Gates:**
   - `npx tsc --noEmit` &rarr; Must PASS with 0 errors.
   - `npx expo lint` &rarr; Must PASS with 0 warnings/errors.
   - `npx jest src/features/match` &rarr; All tests must PASS.

