# Live Match Spectator Hub Specification

> **Target Agent:** Claude  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/features/match/` and `src/app/match/[id]/`. Do not touch `src/features/players/`.

---

## 1. Executive Summary & Purpose

Currently, `MatchLiveScreen` (`src/features/match/match-live-screen.tsx`) displays hard-coded sample data (`sample-match.ts` and `sample-overs.ts`). 
Now that we have real friendly matches, completed/live database seed fixtures, and the ball-by-ball scoring engine, `MatchLiveScreen` must become a **Real Match Spectator Hub**.

When a user taps any match (live, completed, or scheduled) from the Home screen, Matches tab, or Notifications:
1. It loads the real match by `matchId` from `match-repository.ts` / `staged-setups.ts` (or sample data as fallback).
2. Displays real team names, short codes, and colors (e.g. *Halishahar Strikers* vs *Agrabad Tigers*).
3. Displays the real live chase status (e.g. *"Strikers need 13 runs in 12 balls"* or *"Halishahar Strikers won by 12 runs"*).
4. Displays the real crease snapshot: current striker, non-striker, and active bowler.
5. Displays the real ball-by-ball "This Over" strip with color-coded deliveries (boundary = green, six = purple, wicket = red, dot = neutral).
6. Displays the real 4-zone shot distribution on the **Wagon** tab (`match-wagon-screen.tsx`).

---

## 2. Technical Architecture & Data Flow

### 2.1 Match Loading Bridge
Create a lightweight hook: `src/features/match/use-live-match-data.ts`:
- Accepts `matchId: string`.
- Checks:
  1. Active scorer/staged matches in `staged-setups.ts` and `match-repository.ts`.
  2. Fallback to sample fixtures (`hpl-2026-hss-agt` / `sample-match.ts`).
- Derives a typed `LiveMatchViewData`:
  - `header`: title, status ('live' | 'completed' | 'scheduled'), toss summary.
  - `teamA` & `teamB`: name, short, tone, runs, wickets, overs.
  - `currentCrease`: striker, nonStriker, bowler.
  - `recentOvers`: array of overs with ball-by-ball deliveries.
  - `shots`: delivery angles for 4-zone wagon wheel rollup using `src/lib/pitch-quadrant.ts`.

### 2.2 Components to Enhance in `src/features/match/components/`
- `live-hero.tsx`: Bind real team names, scores, run rates, and result summaries.
- `live-scoring-tables.tsx`: Bind live striker/non-striker runs (balls), 4s, 6s, and bowler figures (overs-maidens-runs-wickets, economy).
- `this-over-card.tsx`: Display colorful ball pills for the current over.
- `match-wagon-screen.tsx`: Feed real match shots into `QuadrantSplitCards` instead of static sample shots.

---

## 3. Strict Quality & Verification Guidelines

1. **File Length Budgets:**
   - Every file must be `<= 200 lines` (Hard limit `270 lines`). Split helper subcomponents into `src/features/match/components/`.
2. **Zero-Crash Render Safety:**
   - No raw string or number outside `<Text>`.
   - Never use `{count && <View />}`; use `{count > 0 ? <View /> : null}`.
3. **Strict TypeScript & Tests:**
   - Pass `npx tsc --noEmit` and `npx expo lint`.
   - Add unit tests in `src/features/match/__tests__/live-match-data.test.ts`.

