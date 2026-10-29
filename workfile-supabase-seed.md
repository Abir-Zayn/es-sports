# Supabase Seed Data & Local DB Seeding Specification

> **Target Agent:** Warp CLI  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `supabase/seed.sql`, `package.json` scripts, and local database seeding automation. No front-end screen conflicts.

---

## 1. Executive Summary & Purpose

`esSports` requires a rich, authentic local cricket database seed (`supabase/seed.sql`) so that developers, testers, and agents see a living, vibrant application on first launch rather than empty states.

The seeded data must reflect **authentic grassroots/local Bangladeshi cricket culture** (Chittagong and Dhaka gully/tape-ball tournaments, local clubs, realistic player personas, and ball-by-ball match events with wagon-wheel shot angles).

When `supabase db reset` or `npm run db:reset-and-seed` is executed, it must:
1. Apply all existing migrations in `supabase/migrations/`.
2. Seed verified `auth.users`, `public.profiles`, and `public.profile_private` records.
3. Seed `public.matches` with completed, live, and scheduled fixtures.
4. Populate `public.match_players` linking real profiles and guest players.
5. Populate `public.ball_events` with realistic ball-by-ball delivery sequences and shot angles (enabling wagon-wheel pitch quadrants and career rollup views).
6. Provide instant verified career statistics in `public.player_career_stats` and `public.player_match_figures`.

---

## 2. Realistic Grassroots Cricket Persona & Data Model

### 2.1 Locality & Tournaments
* **Locality:** Chittagong / Chattogram grassroots hubs:
  - *Halishahar*, *Agrabad*, *Pahartali*, *Chawkbazar*.
* **Featured Tournament:** 
  - Title: *"Halishahar Premier League 2026"* (Format: 6-over tape-ball / local cricket).

### 2.2 Featured Teams
1. **Halishahar Strikers**
   - Short code: `HSS` | Tone: `blue`
   - Captain / All-rounder: *Tanvir Ahmed*
2. **Agrabad Tigers**
   - Short code: `AGT` | Tone: `yellow`
   - Captain / Top batter: *Liton Roy*
3. **Pahartali Smashers**
   - Short code: `PTS` | Tone: `neutral`
   - Key Bowler: *Rashedul Islam*
4. **Chawkbazar Kings**
   - Short code: `CBK` | Tone: `blue`
   - All-rounder: *Arif Hossain*

### 2.3 User Accounts & Profiles (Stable UUIDs for local dev)
Provide at least 8 real player profiles with corresponding `auth.users` rows:

| Player Name | Role | Bat Style | Area | District | Phone |
|---|---|---|---|---|---|
| **Tanvir Ahmed** | all-rounder | right | Halishahar | Chattogram | +8801711000001 |
| **Liton Roy** | batter | right | Agrabad | Chattogram | +8801711000002 |
| **Rashedul Islam** | bowler | left | Pahartali | Chattogram | +8801711000003 |
| **Arif Hossain** | keeper | right | Chawkbazar | Chattogram | +8801711000004 |
| **Shakib Chowdhury** | all-rounder | left | GEC | Chattogram | +8801711000005 |
| **Mahmudul Hasan** | batter | right | Nasirabad | Chattogram | +8801711000006 |
| **Kamrul Islam** | bowler | right | Halishahar | Chattogram | +8801711000007 |
| **Zubair Al Mamun** | batter | right | Agrabad | Chattogram | +8801711000008 |

---

## 3. Matches & Ball-by-Ball Event Structure

### 3.1 Match 1: Completed 6-Over Thriller (`status = 'completed'`)
* **Match:** Halishahar Strikers (`team_a`) vs Agrabad Tigers (`team_b`).
* **Toss:** Won by Halishahar Strikers (`toss_winner_side = 'a'`), elected to bat (`toss_decision = 'bat'`).
* **Innings 1 (HSS Batting):**
  - Score: 64 runs for 2 wickets in 6 overs (36 balls).
  - Tanvir Ahmed: 34* off 16 balls (3 fours, 2 sixes).
  - Mahmudul Hasan: 21 off 14 balls (2 fours, 1 six, caught out).
* **Innings 2 (AGT Batting):**
  - Target: 65 runs in 6 overs.
  - Score: 52 runs for 4 wickets in 6 overs (36 balls).
  - Liton Roy: 28 off 18 balls (3 fours).
  - Rashedul Islam bowling: 2 wickets for 14 runs in 2 overs.
* **Result:** Halishahar Strikers won by 12 runs (`winner_side = 'a'`, `result_type = 'runs'`, `result_margin = 12`, `result_summary = 'Halishahar Strikers won by 12 runs'`).

#### Ball Events Requirements for Match 1:
- Sequence begins with `kind = 'innings_start'`.
- Deliveries have `kind = 'delivery'` with valid `delivery_kind` ('runs', 'wide', 'no-ball', 'wicket').
- Realistic shot angles in degrees (`angle` between `0` and `360`):
  - Cover drive / Point: `45°` to `75°`
  - Long-off / Straight: `0°` to `15°`
  - Mid-wicket / Square leg: `280°` to `315°`
  - Fine leg: `220°` to `250°`
- Dismissal types:
  - At least 1 `'Bowled'`
  - At least 1 `'Caught'` with `fielder_key` set.

### 3.2 Match 2: In-Progress Live Match (`status = 'live'`)
* Pahartali Smashers vs Chawkbazar Kings.
* Toss: Won by Chawkbazar Kings, elected to bowl.
* Innings 1 in progress: 3.2 overs bowled, 31/1.
* Status is `'live'`, result columns are `NULL`.

### 3.3 Match 3: Upcoming Scheduled Match (`status = 'scheduled'`)
* Halishahar Strikers vs Chawkbazar Kings.
* Scheduled for tomorrow at 15:30 BST (`now() + interval '1 day'`).
* Status is `'scheduled'`, toss and result columns are `NULL`.

---

## 4. Strict Schema & Constraint Checklist

Warp CLI must ensure all SQL statements in `supabase/seed.sql` satisfy the strict database constraints:

1. **`auth.users` & `profiles` constraint:**
   - Every profile `id` must exist in `auth.users(id)`.
   - Role must be in `('batter', 'bowler', 'all-rounder', 'keeper')`.
   - Batting style must be in `('right', 'left')`.
2. **`matches` constraint checklist:**
   - `matches_toss_complete`: `(toss_winner_side is null) = (toss_decision is null)`.
   - `matches_result_when_completed`: `(status = 'completed') = (result_type is not null)`.
   - `matches_winner_matches_result`: `(result_type in ('runs', 'wickets')) = (winner_side is not null)`.
   - `matches_margin_matches_result`: `(result_margin is not null)` for completed matches with a winner.
   - `team_a_tone` and `team_b_tone` must be `'blue'`, `'yellow'`, or `'neutral'`.
3. **`ball_events` constraint checklist:**
   - `ball_events_shape`:
     - `innings_start` has `striker_key`, `non_striker_key`, `bowler_key`, and `delivery_kind is null`.
     - `delivery` has all keys, `runs`, `total_runs`, `is_legal`, and non-null `delivery_kind`.
   - `ball_events_wicket_has_dismissal`: `(delivery_kind = 'wicket') = (dismissal is not null)`.
   - Foreign keys: `striker_key`, `non_striker_key`, `bowler_key`, etc., must exist in `match_players(match_id, key)`.

---

## 5. Script & Command Integration

In [package.json](file:///c:/office-work/esSports/package.json):

Add scripts under `"scripts"`:
```json
"db:reset-and-seed": "supabase db reset",
"db:seed": "supabase db seed"
```

---

## 6. Verification Steps for Warp CLI

1. Run the migration reset and seed:
   ```bash
   npx supabase db reset
   ```
2. Run SQL verification query:
   ```sql
   -- Verify career stats view calculates rollups correctly
   SELECT profile_id, matches, innings, runs, highest, batting_average, wickets 
   FROM public.player_career_stats;

   -- Verify match figures view
   SELECT p.name, f.runs, f.balls_faced, f.fours, f.sixes, f.wickets 
   FROM public.player_match_figures f
   JOIN public.match_players p ON p.match_id = f.match_id AND p.key = f.key;
   ```
3. Typecheck & lint validation:
   ```bash
   npx tsc --noEmit
   npx expo lint
   ```

