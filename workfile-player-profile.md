# Player Career Profile & 4-Zone Stats Showcase Specification

> **Target Agent:** Codex  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/features/players/` and `src/app/player/[id].tsx`. Do not touch `src/features/match/`.

---

## 1. Executive Summary & Purpose

`esSports` needs a dedicated **Player Career Profile Screen** (`/player/[id]`) so that when users tap on a player in the Top XI squad disc, search results, match scorecards, or leaderboards, they can view the player's full career history.

This screen will display:
1. **Player Hero:** Avatar, Full Name, Jersey Number badge, Playing Role (Batter, Bowler, All-rounder, Keeper), Batting Style (Right / Left), and Area/District (*Halishahar, Chattogram*).
2. **Career Rollup Cards:**
   - **Batting:** Matches, Innings, Total Runs, Highest Score (with `*` for not-out), Batting Average, Strike Rate, 50s & 100s.
   - **Bowling:** Overs Bowled, Wickets, Best Bowling Figures (e.g. `2/14`), Economy Rate, 3-Wicket & 5-Wicket hauls.
3. **4-Zone Pitch Wagon Wheel Breakdown:** Visual cards showing run percentages across 4 pitch quadrants:
   - *Off Side*, *Straight / V*, *Leg Side*, *Behind*.
4. **Recent Match Performances:** Timeline list of recent fixtures with individual batting and bowling figures.
5. **Entry Point Integration:** In `src/features/team/components/player-detail-sheet.tsx`, add a primary action button: `[ View Full Career Profile ]` that navigates to `/player/[id]`.

---

## 2. Directory & Component Structure

```
src/
├── app/
│   └── player/
│       └── [id].tsx                     # Expo Router screen exporting PlayerProfileScreen
├── features/
│   └── players/
│       ├── types.ts                     # Player career & bio data models
│       ├── sample-players.ts            # Realistic sample player careers (Tanvir, Liton, Rashedul)
│       ├── use-player-profile.ts        # Hook to fetch player bio + career rollup
│       ├── player-profile-screen.tsx    # Root screen with safe-insets, scroll & back button (<= 200 lines)
│       ├── components/
│       │   ├── player-hero-card.tsx     # Photo, name, jersey badge, role & district pills
│       │   ├── career-stats-grid.tsx    # Batting and bowling stat tiles
│       │   ├── player-pitch-zones.tsx   # 4-Zone percentage bar & cards using src/lib/pitch-quadrant.ts
│       │   └── player-recent-matches.tsx# List of recent match scorecards
│       └── __tests__/
│           └── player-profile-screen.test.tsx # Unit & integration test suite
```

---

## 3. Data Integration

- Use the player statistics logic from [career-stats.ts](file:///c:/office-work/esSports/src/lib/career-stats.ts) and [career-stats-rollup.ts](file:///c:/office-work/esSports/src/features/scoring/engine/career-stats-rollup.ts).
- For local dev, resolve player by ID from:
  1. `src/features/profile/sample-data.ts`
  2. `supabase/seed.sql` player IDs (e.g. `11111111-1111-4111-8111-000000000001` for Tanvir Ahmed, `...0002` for Liton Roy).
  3. Fallback to realistic mock player profile if ID not found.

---

## 4. Strict Quality & Verification Guidelines

Codex must strictly follow `memory.md`:
1. **File Length Budgets:**
   - Every file must be `<= 200 lines` (Hard limit `270 lines`). Split cards into `src/features/players/components/`.
2. **Zero-Crash Render Safety:**
   - All text and numbers MUST be wrapped inside React Native `<Text>` components.
   - Guard optional stats with `?? 0` and `?.`.
3. **Verification Gates:**
   - `npx tsc --noEmit` &rarr; PASS (0 errors).
   - `npx expo lint` &rarr; PASS (0 warnings).
   - `npx jest src/features/players` &rarr; All tests PASS.

