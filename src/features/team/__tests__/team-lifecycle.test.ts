import { fake } from '@/features/tournament/__fixtures__/supabase-fake';

import { fetchInviteTracker, MAX_INVITES, reinviteStatus, type TrackedInvite } from '../data/team-lifecycle';

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('@/features/tournament/__fixtures__/supabase-fake').fake }));

const NOW = Date.parse('2026-11-25T12:00:00Z');
const row = (id: string, to: string, status: string, minutesAgo: number) => ({
  id, to_user: to, status, created_at: new Date(NOW - minutesAgo * 60_000).toISOString(),
  expires_at: new Date(NOW + 7 * 86_400_000 - minutesAgo * 60_000).toISOString(), profiles: { full_name: to.toUpperCase(), avatar_url: null },
});

beforeEach(() => fake.reset());

describe('the invite tracker', () => {
  it('shows each player once with their latest invite and how many they were sent, leaving out who joined', async () => {
    // Newest first, as the query orders them.
    fake.results.invitations = { data: [
      row('i4', 'monir', 'pending', 40), row('i3', 'tanvir', 'accepted', 50), row('i2', 'monir', 'declined', 90), row('i1', 'monir', 'cancelled', 200),
    ], error: null };
    const tracked = await fetchInviteTracker('team', 'me', NOW);
    expect(tracked).toEqual([expect.objectContaining({ inviteId: 'i4', profileId: 'monir', name: 'MONIR', state: 'pending', sent: 3 })]);
    expect(fake.calls('invitations', 'eq')).toEqual(expect.arrayContaining([['kind', 'team_player'], ['team_id', 'team'], ['from_user', 'me']]));
  });

  it('calls an open invite past its expiry expired', async () => {
    const expired = { ...row('i1', 'rafi', 'pending', 60), expires_at: new Date(NOW - 1).toISOString() };
    fake.results.invitations = { data: [expired], error: null };
    expect((await fetchInviteTracker('team', 'me', NOW))[0].state).toBe('expired');
  });
});

describe('when a player can be invited again', () => {
  const invite = (sent: number, minutesAgo: number): TrackedInvite => ({
    inviteId: 'i', profileId: 'p', name: 'P', avatarUrl: null, state: 'declined', sent, lastSentAt: new Date(NOW - minutesAgo * 60_000).toISOString(),
  });
  it('waits 30 minutes after the last invite, then allows it until 4 invites were sent', () => {
    expect(reinviteStatus(invite(1, 10), NOW)).toEqual({ kind: 'wait', minutes: 20 });
    expect(reinviteStatus(invite(1, 30), NOW)).toEqual({ kind: 'ready' });
    expect(reinviteStatus(invite(MAX_INVITES, 300), NOW)).toEqual({ kind: 'used' });
  });
});
