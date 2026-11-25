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
  setTeamEliminated,
} from '../roster-repository';
import { parseSetup } from '../setup';
import type { Roster, UserSummary } from '../types';
import { sampleRosters } from '../__fixtures__/sample-rosters';

const me: UserSummary = { id: 'me', name: 'Organiser', area: null, avatarUrl: null };
const rafi: UserSummary = { id: 'u-rafi', name: 'Rafi Hasan', area: null, avatarUrl: null };
const nayeem: UserSummary = { id: 'u-nayeem', name: 'Nayeem Islam', area: null, avatarUrl: null };
const T = 'draft:me';

/** The stored roster, with `id` made an accepted moderator, as accepting the invite will do. */
async function asAcceptedModerator(id: string): Promise<Roster> {
  const roster = await fetchRoster(T, me, parseSetup({ teams: '4' }));
  roster.staff = roster.staff.map((m) => (m.user.id === id ? { ...m, status: 'accepted' } : m));
  return roster;
}

describe('roster repository (mock)', () => {
  beforeEach(() => resetRosters(sampleRosters()));

  it('makes the first viewer the owner', async () => {
    const roster = await fetchRoster(T, me, parseSetup({ teams: '8' }));
    expect(roster.staff).toEqual([{ user: me, role: 'owner', status: 'accepted' }]);
    expect(roster.maxTeams).toBe(8);
  });

  it('invites and removes moderators, refusing anyone but the owner', async () => {
    await fetchRoster(T, me, parseSetup({ teams: '4' }));
    const invited = await inviteModerator(T, 'me', rafi);
    expect(invited.staff[1]).toEqual({ user: rafi, role: 'moderator', status: 'pending' });
    await expect(inviteModerator(T, 'u-rafi', nayeem)).rejects.toBeInstanceOf(RosterError);
    const removed = await removeModerator(T, 'me', 'u-rafi');
    expect(removed.staff).toHaveLength(1);
  });

  it('lets an accepted moderator add teams and invite owners, but not disband', async () => {
    await fetchRoster(T, me, parseSetup({ teams: '4' }));
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
    await fetchRoster(T, me, parseSetup({ teams: '8' }));
    for (const [name, short] of [['Alpha', 'AL'], ['Bravo', 'BR'], ['Charlie', 'CH'], ['Delta', 'DE'], ['Foxtrot', 'FO'], ['Golf', 'GO'], ['Hotel', 'HO'], ['India', 'IN']]) {
      await createTeam(T, 'me', { name, short });
    }
    await expect(createTeam(T, 'me', { name: 'Echo', short: 'EC' })).rejects.toThrow('This tournament is set to 8 teams.');
  });

  it('lets only the owner eliminate a team and bring it back', async () => {
    await fetchRoster(T, me, parseSetup({ teams: '8' }));
    await inviteModerator(T, 'me', rafi);
    await asAcceptedModerator('u-rafi');
    const teamId = (await createTeam(T, 'me', { name: 'Alpha', short: 'AL' })).teams[0].id;
    await expect(setTeamEliminated(T, 'u-rafi', teamId, true)).rejects.toThrow('Only the tournament owner can eliminate a team.');
    expect((await setTeamEliminated(T, 'me', teamId, true)).teams[0]).toMatchObject({ id: teamId, eliminated: true });
    expect((await setTeamEliminated(T, 'me', teamId, false)).teams[0].eliminated).toBe(false);
  });
});
