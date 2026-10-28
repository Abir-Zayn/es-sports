import {
  cancelTeamOwnerInvite,
  createTeam,
  disbandTeam,
  fetchRoster,
  inviteModerator,
  inviteTeamOwner,
  removeModerator,
  resetRosters,
  RosterError,
  searchUsers,
} from '../roster-repository';
import type { Roster, UserSummary } from '../types';

const me: UserSummary = { id: 'me', name: 'Organiser', area: null, avatarUrl: null };
const rafi: UserSummary = { id: 'u-rafi', name: 'Rafi Hasan', area: null, avatarUrl: null };
const nayeem: UserSummary = { id: 'u-nayeem', name: 'Nayeem Islam', area: null, avatarUrl: null };
const T = 'draft:me';

/** The stored roster, with `id` made an accepted moderator, as accepting the invite will do. */
async function asAcceptedModerator(id: string): Promise<Roster> {
  const roster = await fetchRoster(T, 4, me);
  roster.staff = roster.staff.map((m) => (m.user.id === id ? { ...m, status: 'accepted' } : m));
  return roster;
}

describe('roster repository (mock)', () => {
  beforeEach(resetRosters);

  it('makes the first viewer the owner', async () => {
    const roster = await fetchRoster(T, 8, me);
    expect(roster.staff).toEqual([{ user: me, role: 'owner', status: 'accepted' }]);
    expect(roster.maxTeams).toBe(8);
  });

  it('finds people by name, leaving out those already in the roster', async () => {
    expect(await searchUsers('r', [])).toEqual([]);
    const found = await searchUsers('hasan', []);
    expect(found.map((u) => u.name)).toEqual(['Rafi Hasan', 'Rakibul Hasan']);
    expect((await searchUsers('hasan', ['u-rafi'])).map((u) => u.id)).toEqual(['u-rakib']);
  });

  it('invites and removes moderators, refusing anyone but the owner', async () => {
    await fetchRoster(T, 4, me);
    const invited = await inviteModerator(T, 'me', rafi);
    expect(invited.staff[1]).toEqual({ user: rafi, role: 'moderator', status: 'pending' });
    await expect(inviteModerator(T, 'u-rafi', nayeem)).rejects.toBeInstanceOf(RosterError);
    const removed = await removeModerator(T, 'me', 'u-rafi');
    expect(removed.staff).toHaveLength(1);
  });

  it('lets an accepted moderator add teams and invite owners, but not disband', async () => {
    await fetchRoster(T, 4, me);
    await inviteModerator(T, 'me', rafi);
    await asAcceptedModerator('u-rafi');
    const withTeam = await createTeam(T, 'u-rafi', { name: 'Chattogram Strikers', short: 'CS' });
    const teamId = withTeam.teams[0].id;
    const invited = await inviteTeamOwner(T, 'u-rafi', teamId, nayeem);
    expect(invited.teams[0].owner).toEqual({ user: nayeem, status: 'pending' });
    await expect(disbandTeam(T, 'u-rafi', teamId)).rejects.toThrow('Only the tournament owner can disband a team.');
    const cancelled = await cancelTeamOwnerInvite(T, 'u-rafi', teamId);
    expect(cancelled.teams[0].owner).toBeNull();
    const disbanded = await disbandTeam(T, 'me', teamId);
    expect(disbanded.teams).toEqual([]);
  });

  it('refuses a team past the tournament team count', async () => {
    await fetchRoster(T, 4, me);
    for (const [name, short] of [['Alpha', 'AL'], ['Bravo', 'BR'], ['Charlie', 'CH'], ['Delta', 'DE']]) {
      await createTeam(T, 'me', { name, short });
    }
    await expect(createTeam(T, 'me', { name: 'Echo', short: 'EC' })).rejects.toThrow('This tournament is set to 4 teams.');
  });
});
