import type { MatchSetup } from '../../types';
import { buildMatchRows, setupFromRows } from '../match-rows';
import type { MatchRow } from '../types';

// Node built-ins, typed by hand: the app does not ship Node type definitions.
const { readFileSync } = jest.requireActual<{ readFileSync: (path: string, encoding: 'utf8') => string }>('fs');
const { cwd } = jest.requireActual<{ cwd: () => string }>('process');

const ID = '33333333-3333-4333-8333-333333333333';
const ACCOUNT = '44444444-4444-4444-8444-444444444444';
const squad = (prefix: string) => [1, 2, 3, 4, 5].map((n) => ({ id: `${prefix}${n}`, name: `Player ${prefix}${n}`, role: 'Batter' }));
const friendly: MatchSetup = {
  title: 'Friendly · Kings vs Strikers', playersPerSide: 4, preset: true, tossWinner: 'CS', decision: 'bowl',
  scorerIds: [ACCOUNT, 'u-preview', ACCOUNT],
  teams: {
    KK: { team: { name: 'Kings', short: 'KI', tone: 'yellow' }, players: squad('a').map((p, i) => ({ ...p, profileId: i === 0 ? ACCOUNT : i === 1 ? 'u-preview' : null })) },
    CS: { team: { name: 'Strikers', short: 'ST', tone: 'blue' }, players: squad('b') },
  },
  playingXi: { KK: ['a1', 'a2', 'a3', 'a4'], CS: ['b2', 'b3', 'b4', 'b5'] },
  strikerId: '', nonStrikerId: '', bowlerId: '', recordShots: true, oversLimit: 8,
};

/** Column names of a table in the migration, read from its `create table` block and later `add column`s. */
function columnsOf(sql: string, table: string): Set<string> {
  const block = sql.split(`create table public.${table} (`)[1]?.split('\n);')[0] ?? '';
  const names = block.split('\n').map((line) => line.trim().split(/\s+/)[0])
    .filter((word) => /^[a-z_]+$/.test(word) && !['constraint', 'primary', 'foreign', 'check'].includes(word));
  return new Set(names);
}

describe('friendly match rows', () => {
  const { match, players, scorers } = buildMatchRows(ID, 'friendly-abc', friendly, new Date('2026-10-29T10:00:00Z'));

  it('stores the real teams, the title and the playing side', () => {
    expect(match).toMatchObject({
      title: 'Friendly · Kings vs Strikers', team_a_name: 'Kings', team_a_short: 'KI', team_a_tone: 'yellow',
      team_b_name: 'Strikers', overs_limit: 8, toss_winner_side: 'b', toss_decision: 'bowl', fixture_ref: 'friendly-abc',
    });
    expect(players.filter((p) => p.in_playing_xi)).toHaveLength(8);
    expect(players.find((p) => p.key === 'b1')?.in_playing_xi).toBe(false);
  });

  it('links only real accounts, so preview ids never break a foreign key', () => {
    expect(players.find((p) => p.key === 'a1')?.profile_id).toBe(ACCOUNT);
    expect(players.find((p) => p.key === 'a2')?.profile_id).toBeNull();
    expect(scorers).toEqual([ACCOUNT]);
  });

  it('reads the friendly back with its teams, side size and settled toss', () => {
    const row: MatchRow = { ...match, tournament_id: null, created_by: ACCOUNT, completed_at: null, result_type: null };
    const setup = setupFromRows(row, players);
    expect(setup).toMatchObject({ preset: true, playersPerSide: 4, tossWinner: 'CS', decision: 'bowl', playingXi: friendly.playingXi });
    expect(setup.teams.KK.team).toEqual({ name: 'Kings', short: 'KI', tone: 'yellow' });
    expect(setup.teams.KK.players[0]).toEqual({ id: 'a1', name: 'Player a1', role: 'Batter', profileId: ACCOUNT });
  });

  it('keeps team image URLs when a saved match is reopened', () => {
    const row: MatchRow = { ...match, team_a_image_url: 'https://example.com/a.png', team_b_image_url: 'https://example.com/b.png',
      tournament_id: null, created_by: ACCOUNT, completed_at: null, result_type: null };
    const setup = setupFromRows(row, players);
    expect(setup.teams.KK.team.avatarUri).toBe('https://example.com/a.png');
    expect(setup.teams.CS.team.avatarUri).toBe('https://example.com/b.png');
  });

  it('writes only columns that exist in the matches migration', () => {
    const sql = readFileSync(`${cwd()}/supabase/migrations/20261029181703_matches.sql`, 'utf8');
    const matchColumns = columnsOf(sql, 'matches');
    const playerColumns = columnsOf(sql, 'match_players');
    expect(matchColumns.has('team_a_name')).toBe(true);
    expect(Object.keys(match).filter((key) => !matchColumns.has(key))).toEqual([]);
    expect(Object.keys(players[0]).filter((key) => !playerColumns.has(key))).toEqual([]);
    expect([...columnsOf(sql, 'match_scorers')]).toEqual(expect.arrayContaining(['match_id', 'user_id']));
  });
});
