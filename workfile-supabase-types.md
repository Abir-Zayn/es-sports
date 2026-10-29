# Supabase TypeScript Types & Typed Client Specification

> **Target Agent:** Warp CLI  
> **Status:** Ready for Implementation  
> **Boundary / Scope:** Dedicated to `src/lib/database.types.ts`, `src/lib/supabase.ts`, and an offline type generation script. No front-end screen conflicts.

---

## 1. Executive Summary & Purpose

Currently in `src/lib/supabase.ts`, the Supabase client is untyped:
```typescript
export const supabase = createClient(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_KEY, ...);
```
There is no `src/lib/database.types.ts` in the repository, which means database queries lack compile-time safety and column auto-completion.

This task will:
1. Generate / author the complete `src/lib/database.types.ts` reflecting all 3 database migrations:
   - `supabase/migrations/20261028000000_profiles.sql`
   - `supabase/migrations/20261029000000_matches.sql`
   - `supabase/migrations/20261030000000_player_career_stats.sql`
2. Update `src/lib/supabase.ts` to export a strictly typed client: `createClient<Database>(...)`.
3. Add helper type exports (e.g. `Tables<'matches'>`, `Tables<'ball_events'>`, `Views<'player_career_stats'>`).
4. Ensure `npm run check:quick` and `npm run check:all` pass with 0 errors.

---

## 2. Database Schema to Map in `src/lib/database.types.ts`

### 2.1 Public Tables
1. **`profiles`:**
   - `id`: string (UUID)
   - `full_name`: string | null
   - `avatar_url`: string | null
   - `area`: string | null
   - `district`: string | null
   - `role`: `'batter' | 'bowler' | 'all-rounder' | 'keeper' | null`
   - `batting_style`: `'right' | 'left' | null`
   - `created_at`: string
   - `updated_at`: string
2. **`profile_private`:**
   - `id`: string (UUID)
   - `phone`: string | null
   - `national_id`: string | null
   - `blood_group`: `'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | null`
   - `updated_at`: string
3. **`matches`:**
   - `id`: string (UUID)
   - `tournament_id`: string | null
   - `fixture_ref`: string | null
   - `created_by`: string | null
   - `title`: string | null
   - `team_a_name`: string
   - `team_a_short`: string
   - `team_a_tone`: `'blue' | 'yellow' | 'neutral'`
   - `team_b_name`: string
   - `team_b_short`: string
   - `team_b_tone`: `'blue' | 'yellow' | 'neutral'`
   - `overs_limit`: number
   - `status`: `'scheduled' | 'live' | 'completed'`
   - `toss_winner_side`: `'a' | 'b' | null`
   - `toss_decision`: `'bat' | 'bowl' | null`
   - `record_shots`: boolean
   - `scheduled_at`: string | null
   - `started_at`: string | null
   - `completed_at`: string | null
   - `team_a_runs`: number | null
   - `team_a_wickets`: number | null
   - `team_a_balls`: number | null
   - `team_b_runs`: number | null
   - `team_b_wickets`: number | null
   - `team_b_balls`: number | null
   - `winner_side`: `'a' | 'b' | null`
   - `result_type`: `'runs' | 'wickets' | 'tie' | null`
   - `result_margin`: number | null
   - `result_summary`: string | null
   - `created_at`: string
   - `updated_at`: string
4. **`match_players`:**
   - `match_id`: string (UUID)
   - `key`: string
   - `side`: `'a' | 'b'`
   - `name`: string
   - `role`: string | null
   - `in_playing_xi`: boolean
   - `sort_order`: number
   - `profile_id`: string | null
5. **`match_scorers`:**
   - `match_id`: string (UUID)
   - `user_id`: string (UUID)
   - `added_at`: string
6. **`ball_events`:**
   - `id`: string (UUID)
   - `match_id`: string (UUID)
   - `seq`: number
   - `innings`: 1 | 2
   - `kind`: `'innings_start' | 'delivery' | 'bowler' | 'swap_ends'`
   - `striker_key`: string | null
   - `non_striker_key`: string | null
   - `bowler_key`: string | null
   - `delivery_kind`: `'runs' | 'wide' | 'no-ball' | 'bye' | 'leg-bye' | 'wicket' | null`
   - `runs`: number | null
   - `total_runs`: number | null
   - `is_legal`: boolean | null
   - `dismissal`: `'Bowled' | 'Caught' | 'LBW' | 'Run out' | 'Stumped' | 'Caught & bowled' | 'Hit wicket' | null`
   - `out_key`: string | null
   - `next_batter_key`: string | null
   - `fielder_key`: string | null
   - `angle`: number | null
   - `voided_at`: string | null
   - `created_at`: string

### 2.2 Public Views
1. **`player_match_figures`:**
   - `profile_id`: string
   - `match_id`: string
   - `key`: string
   - `completed_at`: string
   - `batted`: boolean
   - `runs`: number
   - `balls_faced`: number
   - `fours`: number
   - `sixes`: number
   - `not_out`: boolean
   - `balls_bowled`: number
   - `runs_conceded`: number
   - `wickets`: number
2. **`player_career_stats`:**
   - `profile_id`: string
   - `matches`: number
   - `innings`: number
   - `not_outs`: number
   - `runs`: number
   - `balls_faced`: number
   - `fours`: number
   - `sixes`: number
   - `highest`: number | null
   - `highest_not_out`: boolean | null
   - `batting_average`: number | null
   - `wickets`: number
   - `balls_bowled`: number
   - `runs_conceded`: number

---

## 3. Client Integration in `src/lib/supabase.ts`

```typescript
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { authStorage } from './auth-storage';
import type { Database } from './database.types';
import { env } from './env';
import { fetchWithTimeout } from './fetch-with-timeout';

export const supabase = createClient<Database>(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_KEY, {
  global: { fetch: fetchWithTimeout },
  auth: {
    ...(Platform.OS !== 'web' ? { storage: authStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Views<T extends keyof Database['public']['Views']> = Database['public']['Views'][T]['Row'];
```

---

## 4. Verification

1. Run `npm run check:quick` to verify TypeScript compile and lint.
2. Ensure no typing conflicts with existing code.

