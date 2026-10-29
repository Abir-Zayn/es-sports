# Search Discovery & Profile Navigation Wiring Specification

> **Target Agent:** Codex  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/features/search/`. Do not touch `src/features/match/` or `scripts/`.

---

## 1. Executive Summary & Purpose

Currently in `esSports`, the Search Screen (`src/features/search/search-screen.tsx`) allows users to search by keyword across "Tournaments", "Teams", and "Players". 

However, clicking on a search result is incomplete:
- Tapping a **Player** currently triggers `comingSoon('Players')` instead of navigating to the newly created `/player/[id]` Career Profile.
- Tapping a **Tournament** currently triggers `comingSoon('Tournaments')` instead of navigating to `/tournament/[id]`.
- The search catalogue in `sample-data.ts` only contains old static placeholder rows and does not include the newly seeded Chittagong/Bangladeshi grassroots players, teams, and tournaments.

This task will:
1. **Wire Navigation:**
   - Tapping a **Player** row navigates to `/player/[id]` with `id`, `name`, and `role` params.
   - Tapping a **Tournament** row navigates to `/tournament/[id]`.
   - Tapping a **Team** row navigates to `/team/[id]`.
2. **Enrich Search Catalogue with Authentic Local Data:**
   - Add seeded players: *Tanvir Ahmed*, *Liton Roy*, *Rashedul Islam*, *Arif Hossain*, *Shakib Chowdhury*, *Mahmudul Hasan*.
   - Add seeded teams: *Halishahar Strikers* (`HSS`), *Agrabad Tigers* (`AGT`), *Pahartali Smashers* (`PTS`), *Chawkbazar Kings* (`CBK`).
   - Add featured tournaments: *Halishahar Premier League 2026*, *Strikers Cup 2026*.
3. **Enhance Search UX:**
   - Save executed searches to `recentSearches` so tapping a search adds it to the recent history.
   - Display a role/type badge on search result rows.
4. **Automated Testing:**
   - Add unit and interaction tests in `src/features/search/__tests__/search-screen.test.tsx` verifying tab filtering, query filtering, and navigation transitions.

---

## 2. File Architecture & Responsibilities

```
src/
└── features/
    └── search/
        ├── sample-data.ts             # Enriched search catalogue (Players, Teams, Tournaments)
        ├── search-screen.tsx          # Main search screen with real navigation (<= 200 lines)
        ├── components/
        │   ├── recent-searches.tsx    # Recent search pills with onPick and clear options
        │   └── result-row.tsx         # Hit row with avatar, name, badge/meta, and chevron
        └── __tests__/
            └── search-screen.test.tsx # Comprehensive test suite (filtering, tabs, routing)
```

---

## 3. Navigation Routing Rules

In [search-screen.tsx](file:///c:/office-work/esSports/src/features/search/search-screen.tsx):

```typescript
function handleSelectRow(row: SearchRow, groupId: SearchGroupId) {
  if (groupId === 'players') {
    router.push({
      pathname: '/player/[id]',
      params: { id: row.id, name: row.name },
    });
  } else if (groupId === 'tournaments') {
    router.push({
      pathname: '/tournament/[id]',
      params: { id: row.id },
    });
  } else if (groupId === 'teams') {
    openTeam(row.short);
  }
}
```

---

## 4. Strict Quality & Verification Guidelines

Codex must strictly adhere to `memory.md`:
1. **File Length Budgets:**
   - Every file must be `<= 200 lines` (Hard limit `270 lines`).
2. **Zero-Crash Render Safety:**
   - NEVER render raw text or numbers outside React Native `<Text>` components.
   - Avoid `{count && ...}`. Use `{count > 0 ? ... : null}`.
3. **Verification Gates Before Completion:**
   - `npx tsc --noEmit` &rarr; Must PASS with 0 errors.
   - `npx expo lint` &rarr; Must PASS with 0 warnings/errors.
   - `npx jest src/features/search` &rarr; All tests must PASS.
   - `graphify update .` &rarr; Rebuild graph.

