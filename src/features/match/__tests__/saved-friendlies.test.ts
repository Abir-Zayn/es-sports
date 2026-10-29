import { resumableFriendlies } from '../components/saved-friendlies';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const match = (id: string, created_at: string) => ({ id, created_at, team_a_name: 'A', team_b_name: 'B' });

it('shows only a creator’s unassigned matches and matches assigned to the current scorer', () => {
  const owned = [match('own', '2026-10-01'), match('delegated', '2026-10-02')];
  const assigned = [match('assigned', '2026-10-03')];
  const assignments = [{ match_id: 'delegated', user_id: 'other' }, { match_id: 'assigned', user_id: 'me' }];
  expect(resumableFriendlies(owned, assigned, assignments, 'me').map((item) => item.id)).toEqual(['assigned', 'own']);
});
