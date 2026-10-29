# Friendly Match Engine: Implementation Report

**Spec:** `workfile-friendly-match.md` · **Date:** 29 Oct 2026 · **Branch:** `feat/tournament-squad-lifecycle` (not committed)

## Summary

The full friendly-match spec is built: all five phases, with every checkbox in `workfile-friendly-match.md` ticked.

A captain can now go from **Home or Matches → "+ Friendly Match"** to live scoring in one screen and one toss. They pick the overs and the side size, build both squads (app users or guests), choose a scorer, flip the coin and score. When the chase ends, a **result card** shows the winner, the top performers and where the runs came from. The finished match is then **added to the career** of every player who has an app account.

To make this possible, the scoring engine had to stop assuming two fixed sample teams of eleven. It now scores any two teams of **2 to 16 a side**.

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (0 errors) |
| `npx expo lint` | **PASS** (0 warnings) |
| `npx jest` | **PASS**: 60 suites, 341 tests (before: 49 suites, 292 tests) |
| SQL migration run against Postgres | **NOT RUN**: Docker is not available on this machine |
| Real device / low-end phone | **NOT RUN** |

---

## 1. What a user can do now

1. **Start:** tap **+ Friendly Match** on Home or the Matches tab, which opens `/match/friendly/setup`.
2. **Format:**
   - Choose the overs as one-tap pills: 4, 6, 8, 10, 12, 15 or 20.
   - Set **players a side** with a stepper from 4 to 16.
   - A caption shows how many overs each bowler may bowl.
3. **Teams A and B:**
   - Give each team a name and a colour (Blue, Yellow or Grey). The avatar code is made from the name, e.g. "Karnaphuli Kings" → **KK**.
   - **Find player:** search registered users with the same debounced search used for tournament squads, and pick a role.
   - **Quick add:** add a guest by name and an optional phone.
   - **Add me to this team:** a one-tap button for the organiser.
   - Each player row has a **Playing / Bench** switch. A squad can hold up to 16; the extra players sit on the bench.
4. **Scorer:** the scorer defaults to **You**. You can hand scoring to any app user in either squad. When scoring starts, that person is sent a link through the share sheet.
5. **Proceed to Toss:** if something is wrong, every problem is shown next to its card instead of the toss opening.
6. **Toss:**
   - Pick which team calls, and Heads or Tails, then **Flip coin**.
   - The coin spins and lifts: gold with a crown for heads, silver with stumps for tails.
   - A banner shows "*Karnaphuli Kings won the toss!*" and how the call went.
   - The winner picks **Bat first** or **Bowl first**, then taps **Start scoring**.
7. **Scoring:**
   - The scorer opens on an **Openers** screen. The toss and the playing sides are already decided, so it only asks for the striker, non-striker and bowler.
   - The pad shows the real team names and the match title.
   - The live view now includes strike rate, 4s and 6s for each batter, and the bowler's overs-maidens-runs-wickets and economy.
   - It also shows the run rate, balls bowled and balls left.
8. **Shot direction:** after each scoring shot, a **four-zone bar** offers one-tap logging: Off side, Straight / V, Leg side, Behind. Precise placement on the field is still there for scorers who want it.
9. **Result:**
   - When the chase ends, **Match summary** opens a result card: the winner and margin, both totals, and the **Player of the match, Best batter and Best bowler**.
   - The card also shows the match **wagon wheel**, the **four-zone run split**, and the **career update** for each linked player.
10. **Profile:** a player with an account sees the match added to their career figures and to their recent performances.

---

## 2. Phase by phase

### Phase 1: Setup and squads (done)

| Spec item | Where |
| --- | --- |
| Setup screen at `src/app/match/friendly/setup.tsx` | Route re-exports `features/match/friendly-setup-screen.tsx`; registered in the signed-in block of `_layout.tsx` |
| Overs picker (4 to 20) and players-per-side selector (4 to 16) | `components/friendly-setup-form.tsx` → `FriendlyFormatCard` |
| Two ways to add players to Team A and Team B | `components/friendly-team-card.tsx` and `components/friendly-sheets.tsx`. They reuse the tournament `UserSearchSheet` and `AddGuestSheet` through their public `index.ts` files |
| Scorer selector | `ScorerAssignmentRow` and the scorer sheet |

**Rules** (`friendly/friendly-rules.ts`, pure functions, all unit-tested):
- A team name must be 2 to 30 characters, and the two names must differ.
- Each side must have exactly as many **playing** players as the side size. Changing the side size keeps the players already chosen, then promotes from the bench.
- One person plays for one side only, matched by **account or phone number** (the same anti-ringer rule as tournaments).
- A squad holds at most 16 players. Player names and phone numbers are validated.
- **Bowling check:** each bowler may bowl a fifth of the innings, as the scorer enforces. If the side cannot cover the overs, the toss is blocked with an explanation, e.g. "4 a side for 20 overs".
- The scorer must be the creator or an app user in one of the squads. If the assigned scorer is removed from a squad, scoring goes back to the creator.

### Phase 2: Coin toss (done)

- `components/toss-coin-modal.tsx`:
  - The animation uses React Native's built-in `Animated` (rotateY spin plus a lift) on the native driver, so **no new dependency**.
  - If the phone has **Reduce Motion** turned on, the toss lands straight away.
- `friendly/toss.ts`:
  - `flipCoin` takes an optional random source so tests can fix the result. A test checks the coin is fair over 2,000 flips.
  - Also has `tossWinner`, `decideToss` and `battingFirstSide`.
- **Where the toss result goes:**
  - The setup is marked `tossed` and turned into the scorer's setup (`friendly/to-scorer-setup.ts`).
  - That setup is handed to the scorer through `scoring/data/staged-setups.ts`.
  - When the first innings starts, the toss winner and decision are saved to `matches.toss_winner_side` / `toss_decision`.

### Phase 3: Scorer pad and four-zone shot tracking (done)

- **Toss to scorer:**
  - Opening `/scorer/friendly-…` loads the prepared setup, under a match id that is fixed in advance. That fixed id is what lets the scorer link be shared before the match exists.
  - The setup screen switches to **Openers only** (`setup.preset`), hides the "Try the reference match" demo, and leaving goes back to the Matches tab.
- `PitchQuadrantBar` (`scoring/components/pitch-quadrant-bar.tsx`) sits on the shot sheet. One tap saves the zone.
- **How the zone is stored:** as the zone's centre angle on the delivery (`Delivery.angle`). The reducer also keeps a list of shots for each innings (`ScoreState.shots`, carried into the second innings), which feeds the match wagon wheel. Storing an angle means **no database change**: the existing `ball_events.angle` column holds it, and a precise field tap and a zone tap use the same format.
- **Zone logic** lives in `src/lib/pitch-quadrant.ts`: `quadrantOf(angle)`, `quadrantAngle(zone)` and `quadrantSplit(shots)`. Zone shares always add up to exactly 100%.
- **Wagon wheel:** the match **Wagon** tab now shows four-zone split cards under the off/leg split, and the friendly result screen draws the match's own wagon wheel.

### Phase 4: Result and careers (done)

- `scoring/engine/career-stats-rollup.ts`:
  - `matchPerformances(score)` reads both innings into one line per player. A batter "batted" if they faced a ball, were out, or were at the crease when the innings ended, so a not-out non-striker still counts.
  - `topPerformers` picks the best batter, the best bowler and the **Player of the match**. Impact points are: a run 1, a wicket 20, a maiden 10.
  - `rollupCareerStats` gives the spec's `{ highestRun, totalMatches, totalWickets, avg }`.
- `src/lib/career-stats.ts`:
  - Keeps raw career totals and derives everything a profile shows from them: highest (with `*` for not out), average, strike rate, 50s and 100s, overs, best figures, economy, bowling average, 3-wicket and 5-wicket hauls.
  - Adding a match never re-parses display text.
- **Career ledger** (`profile/career-ledger.ts`):
  - When a match finishes, `useCareerRollup` records it **once per match id**. **Undoing the final ball takes it back out.**
  - The profile adds these matches to the existing career figures and puts them at the top of **Recent performances**.
  - The reference demo match never counts.
- **Result card:** `match/components/match-result-summary-card.tsx` (presentational), plus `scoring/result-screen.tsx` at the new route `/scorer/[id]/result`, opened from **Match summary** on the pad.

### Phase 5: Verification and Supabase readiness (done)

- **10 new test suites:**
  - Rules: friendly rules, toss, scorer-setup bridge.
  - Shared logic: pitch zones, career stats, career rollup.
  - Data: friendly match rows, opening a prepared friendly.
  - **End-to-end:** setup screen to toss to scorer handoff; scoring a whole friendly to the result, the career ledger and the result screen.
- **Schema check against the migration:** `friendly-rows.test.ts` reads `supabase/migrations/20261029000000_matches.sql` and fails if the app writes a column to `matches` or `match_players` that the migration does not define. This keeps the payload in line with the schema automatically.
- **New migration** `supabase/migrations/20261030000000_player_career_stats.sql`:
  - Read-only views: `player_match_figures` (per account, per completed match) and `player_career_stats` (career totals and average).
  - Built from the ball log with the **same rules as the scorer**, using `security_invoker` so the existing read policies still apply.
  - **NOT RUN against a database** (see risks).

---

## 3. Improvements beyond the spec

- **The engine works for any team size, not just eleven.**
  - The innings ends when one batter is left (side size − 1), and the last wicket needs no "next batter".
  - The winning margin "by N wickets" uses the real side size.
  - The scorer's own setup screen now says "Choose 6 players", not "eleven".
- **Real names everywhere:** the pad, the setup and the saved match use the real team names, short codes and colours. Before, they were hard-coded to "Match 12 · Kings vs Strikers".
- **Resuming a saved match** rebuilds its teams from the saved rows. It no longer falls back to the sample squads.
- **New figures:** batters now track **4s and 6s**, and bowlers track **maidens** (byes and leg byes do not spoil a maiden).
- **Bowling check:** the setup will not let you start a match the bowlers cannot finish, e.g. 4 a side for 20 overs.
- **Assigned scorer is enforced by the database:**
  - The assigned scorer is written to `match_scorers`, so the database's own permission rules let them score.
  - They get a share-sheet link to `scorer/<match id>`.
  - Only real account ids are stored, so preview ids can never break a link to another table.
- **Lost setups are caught:** a friendly reference that was never set up on this phone shows "This friendly match was not started. Set it up again." It no longer quietly opens the sample teams.
- **Finished friendlies stay reachable:** reopening a finished friendly by its reference now opens it. Before, only live matches were found that way.
- **Bench management:** players can move between Playing and Bench, and the side size never silently drops a chosen player.
- **"Add me to this team":** one tap for the organiser to join a side.
- **Shared helpers:**
  - Phone checks moved to `src/lib/phone.ts` and the share helpers to `src/lib/share.ts`, so friendlies and tournaments use one copy.
  - `isUuid` moved to `scoring/data/uuid.ts`, so the match-row code no longer loads the Supabase client.
- **Accessibility:**
  - Zones, overs, colours and the scorer choice are radio groups; the Playing/Bench control is a switch.
  - The coin and the result read out their state, and the toss respects Reduce Motion.

---

## 4. Where this differs from the spec

| Spec | Built | Why |
| --- | --- | --- |
| `PitchQuadrantBar` in `match/components/` | `scoring/components/pitch-quadrant-bar.tsx`, with the zone logic in `src/lib/pitch-quadrant.ts` | The scorer uses it, so it belongs to scoring. The pure logic is shared by the scorer, the wagon screen and the result card |
| `FriendlyTeamSquad.players: SquadPlayer[]` | `FriendlyPlayer[]`: id, name, role, userId, phone, playing | Needed to link an account (for careers), check duplicates, and bench players |
| `FriendlyTossResult.calledByTeamId / winnerTeamId` | `calledBy`, `landed`, `winner` as `'teamA' / 'teamB'` | Teams have no ids before the match is saved; also records how the coin landed |
| `assignedScorerId` defaults to the user | Empty means "the creator" | The creator can always score (database rule `can_score_match`) |
| Toss "persisted to the match session" | The toss result is used to build the scorer's setup and is saved with the first innings | The `matches` table only stores who won the toss and the decision; the heads/tails call is not saved anywhere |
| Career types in `team/types.ts` and `profile/types.ts` | `src/types/profile.ts` (shared) | Used by scoring, profile and `lib` alike |
| Team `player-detail-sheet.tsx` shows updated records | Not changed | The team screens still show sample data; the profile is where careers update |

---

## 5. Definition of Done (memory.md §11)

### 1. Scope
- **New: friendly match**
  - Route `src/app/match/friendly/setup.tsx`.
  - `features/match/friendly-setup-screen.tsx`.
  - `features/match/friendly/{friendly-rules,toss,to-scorer-setup}.ts`.
  - `features/match/components/{friendly-setup-form,friendly-team-card,friendly-sheets,toss-coin-modal,friendly-match-cta,match-result-summary-card,quadrant-split-cards}.tsx`.
  - Friendly types added to `features/match/types.ts`.
- **New: scoring**
  - Route `src/app/scorer/[id]/result.tsx`.
  - `scoring/result-screen.tsx`, `scoring/use-career-rollup.ts`.
  - `scoring/engine/career-stats-rollup.ts`.
  - `scoring/data/{staged-setups,uuid}.ts`, `scoring/components/pitch-quadrant-bar.tsx`.
- **New: shared and profile**
  - `src/lib/{pitch-quadrant,career-stats,phone,share}.ts`.
  - `profile/career-ledger.ts`, `tournament/squad/index.ts`.
- **New: database** — the migration `supabase/migrations/20261030000000_player_career_stats.sql`.
- **Changed: scoring engine** — `types.ts`, `sample-data.ts`, `session-reducer.ts`, `engine/create-innings.ts`, `engine/score-delivery.ts`.
- **Changed: scoring data** — `data/{match-rows,match-repository,match-result,load-scorer,types}.ts`, `use-match-sync.ts`.
- **Changed: scoring screens** — `scorer-provider.tsx`, `use-scorer-routes.ts`, `setup-screen.tsx`, `pad-screen.tsx`, `shot-screen.tsx`, `components/{crease-summary,score-summary,opening-players,playing-xi-editor}.tsx`, `README.md`.
- **Changed: elsewhere**
  - `match/match-wagon-screen.tsx`.
  - `profile/{profile-provider,sample-data}.ts(x)`.
  - `tournament/roster/{index,share-invite,squad-rules}.ts`, `tournament/squad/components/add-guest-sheet.tsx` (new optional `note`).
  - `home/home-screen.tsx`, `matches/matches-screen.tsx`, `app/_layout.tsx`.
  - `types/{cricket,profile}.ts`, `workfile-friendly-match.md` (ticked).
- **New tests** (10 suites) — listed in Phase 5.
- **Not mine:** a separate piece of work added `features/notifications/*`, `app/notifications.tsx` and `workfile-notifications.md` during this session. It also edited `home-screen.tsx` and `_layout.tsx` (the notifications lines). I did not touch any of it. Its test suite is included in the 60-suite count.

### 2. Architecture and file size
- **One-way dependencies:**
  - Shared logic (zones, career maths, phone, share) sits in `src/lib`.
  - Scoring knows nothing about friendlies; it only accepts a prepared setup through `staged-setups.ts`.
  - The friendly feature reaches tournament code only through its public `index.ts` files: `tournament/roster`, plus the new `tournament/squad/index.ts`.
- **One known cross-feature link:** scoring imports two presentational match components (wagon wheel, result card), as it already did with `match/sample-info`.
- **File sizes:** the largest new or changed file is `types/cricket.ts` at 180 lines (type declarations; I added 3 lines). The largest component is `profile-provider.tsx` at 172 lines (it was 160). Every file is under 200.
- **Strict TypeScript:** no `any`, no `@ts-ignore`. The test that reads the migration file uses typed `jest.requireActual`, because the project has no `@types/node` and I did not add one.

### 3. Verification evidence
- `npx tsc --noEmit` → **PASS** (exit 0)
- `npx expo lint` → **PASS** (exit 0, no output). One rule (reading a ref during render) was fixed by keeping the coin's `Animated.Value` in `useState`.
- `npx jest` → **PASS**: Test Suites 60 passed / 60; Tests 341 passed / 341.
- SQL migration → **NOT RUN** (`docker info` failed, so there is no local Supabase).
- On a device (Android or iOS, low-end phone) → **NOT RUN**.

### 4. Safety and cleanup
- **Render safety:** every number and string is inside `<Text>`; conditional rendering uses ternaries or `Boolean`/`> 0`, never `{count && …}`; the zone bar widths are clamped to 0–100 and guarded against NaN.
- **Toss animation:**
  - The animation is stopped when the toss closes.
  - Its end callback checks the screen is still open before updating.
  - The Reduce Motion check falls back to "off" if it fails.
- **Sheets** mount their content only while open, so every opening starts fresh.
- **Refused changes** (full squad, duplicate player, side already full) are caught and shown, never thrown into the render.
- **Career ledger:**
  - It is keyed by match id, so retries and replays cannot double-count.
  - Undo removes the match; the demo match never records.
- **Saving:**
  - Assigned scorers are written as part of the match-creation step. That step is already safe to repeat, so a retry cannot duplicate them.
  - Preview ids are never sent as foreign keys.

### 5. Low-end performance
- No new dependencies. The coin uses the native driver.
- **Lists are bounded:** at most 16 players per squad, and 4 zone cards.
- The shot list grows by one entry per scoring shot, which is small for a 20-over match.
- Match lines, the result and the zone split are calculated once and cached between screen updates.
- The profile only recalculates the career when the ledger changes.
- Not measured on a device.

### 6. Unresolved risks and next steps
- **The career ledger is in memory only.** It resets when the app restarts.
  - Next step: read `player_career_stats` from Supabase on the profile, once the migration is applied.
  - Until then, device careers are added on top of the **sample** career figures, as the profile already showed.
- **A prepared friendly is also in memory until the first ball.**
  - If the app is closed between the toss and the first ball, the setup is lost. The scorer then says "Set it up again".
  - After the first ball, the match is saved and resumes normally.
- **The migration has not been run.** It needs `supabase db reset` / `supabase db push`, and a check against real data.
- **The assigned scorer's link:**
  - It only works after the first innings has started, because the match is not saved before then.
  - It uses the `essports://` link scheme until the https app links are set up.
- **Search for app users is still the mock roster search.** Mock ids are not real accounts, so the "real account only" rule means **careers update only for real signed-in accounts**. In testing that is the organiser, through "Add me to this team".
- **The spectator wagon screen** still uses sample shots; a live spectator feed is still pending (see `scoring/README.md`).
- **Team screens** (`player-detail-sheet.tsx`) still show sample careers.
- **Server stats:** maidens are not derived in the SQL view yet.
- **Not saved:** the heads/tails call is not saved anywhere; the guest phone number is checked for duplicates but not saved with the match.
- **Manual device check needed:**
  - The coin animation on Android and iOS.
  - The share sheet when a scorer is assigned.
  - Keyboard behaviour in the team name fields inside the scrolling screen.
- **Nothing is committed.** Say the word and I will commit and push to `feat/tournament-squad-lifecycle`.
