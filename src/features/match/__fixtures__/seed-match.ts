import type { BallEventRow, MatchRow, PlayerRow } from '@/features/scoring/data/types';

/**
 * The completed seed match (Halishahar Strikers 64/2 beat Agrabad Tigers 52/4), read from `supabase/seed.sql` so
 * tests replay exactly what the database is seeded with. Test-only: it reads the file with Node.
 */
export const SEED_MATCH_ID = '22222222-2222-4222-8222-000000000001';

// Node built-ins, typed by hand: the app does not ship Node type definitions.
const { readFileSync } = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
const { cwd } = jest.requireActual<{ cwd: () => string }>('process');

type Value = string | number | boolean | null;

/** The value tuples of one `insert into public.<table>` block of the seed, for the seeded completed match. */
function seedTuples(sql: string, table: string): Value[][] {
  const block = sql.split(`insert into public.${table} (`)[1]?.split(';\n')[0] ?? '';
  return block.split('\n').filter((line) => line.trim().startsWith(`('`) && line.includes(SEED_MATCH_ID)).map((line) =>
    (line.match(/'(?:[^']|'')*'|[^,\s()]+/g) ?? []).map((token): Value => {
      if (token.startsWith(`'`)) return token.slice(1, -1).replace(/''/g, `'`);
      if (token === 'null') return null;
      if (token === 'true' || token === 'false') return token === 'true';
      return Number(token);
    }));
}

const sql = readFileSync(`${cwd()}/supabase/seed.sql`, 'utf8');

export const seedPlayers: PlayerRow[] = seedTuples(sql, 'match_players').map(([match_id, key, side, name, role, in_playing_xi, sort_order, profile_id]) => ({
  match_id, key, side, name, role, in_playing_xi, sort_order, profile_id,
}) as PlayerRow);

export const seedEvents: BallEventRow[] = seedTuples(sql, 'ball_events').map((t, seq) => ({
  id: t[0], match_id: t[1], innings: t[2], kind: t[3], striker_key: t[4], non_striker_key: t[5], bowler_key: t[6],
  delivery_kind: t[7], runs: t[8], total_runs: t[9], is_legal: t[10], dismissal: t[11], out_key: t[12],
  next_batter_key: t[13], fielder_key: t[14], angle: t[15], seq, voided_at: null,
}) as BallEventRow);

export const seedMatch: MatchRow = {
  id: SEED_MATCH_ID, tournament_id: null, fixture_ref: 'hpl-2026-hss-agt', created_by: 'organiser',
  title: 'Halishahar Premier League 2026 · Halishahar Strikers vs Agrabad Tigers',
  team_a_name: 'Halishahar Strikers', team_a_short: 'HSS', team_a_tone: 'blue',
  team_b_name: 'Agrabad Tigers', team_b_short: 'AGT', team_b_tone: 'yellow',
  overs_limit: 6, status: 'completed', toss_winner_side: 'a', toss_decision: 'bat', record_shots: true,
  started_at: '2026-10-29T09:00:00.000Z', completed_at: '2026-10-29T10:00:00.000Z', result_type: 'runs',
};
