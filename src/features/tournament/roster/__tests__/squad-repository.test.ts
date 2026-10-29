import { createTeam, fetchRoster, inviteTeamOwner, lockRosters, resetRosters, RosterError } from '../roster-repository';
import { parseSetup } from '../setup';
import { addGuestPlayer, addMemberPlayer, claimGuestProfile, findClaim, removePlayer } from '../squad-repository';
import type { UserSummary } from '../types';

const me: UserSummary = { id: 'me', name: 'Organiser', area: null, avatarUrl: null };
const rafi: UserSummary = { id: 'u-rafi', name: 'Rafi Hasan', area: null, avatarUrl: null };
const T = 'draft:me';

/** A tournament with one team that the organiser owns, so they can build its squad. */
async function ownedTeam(): Promise<string> {
  await fetchRoster(T, me, parseSetup({ teams: '4', side: '6', minSquad: '8', maxSquad: '10', name: 'Gully Cup' }));
  const { teams } = await createTeam(T, 'me', { name: 'Strikers', short: 'ST' });
  const owned = await inviteTeamOwner(T, 'me', teams[0].id, me);
  expect(owned.teams[0].owner?.status).toBe('accepted');
  return teams[0].id;
}

describe('squad repository (mock)', () => {
  beforeEach(resetRosters);

  it('adds members and guests, giving each guest a claim link', async () => {
    const teamId = await ownedTeam();
    await addMemberPlayer(T, 'me', teamId, rafi, 'Bowler');
    const roster = await addGuestPlayer(T, 'me', teamId, { name: ' Liton Roy ', phone: '01712 000001', role: 'Keeper' });
    const [member, guest] = roster.teams[0].players;
    expect(member).toMatchObject({ name: 'Rafi Hasan', userId: 'u-rafi', role: 'Bowler', claimToken: null });
    expect(guest).toMatchObject({ name: 'Liton Roy', userId: null, phone: '01712000001', role: 'Keeper', addedDuringTournament: false });
    expect(guest.claimToken).toEqual(expect.any(String));
    expect(roster.audit).toEqual([]);
  });

  it('refuses squad changes from anyone but the team owner', async () => {
    const teamId = await ownedTeam();
    await expect(addMemberPlayer(T, 'u-rafi', teamId, rafi, 'Batter')).rejects.toBeInstanceOf(RosterError);
  });

  it('after the lock, needs a reason and records an alert for each change', async () => {
    const teamId = await ownedTeam();
    const added = await addGuestPlayer(T, 'me', teamId, { name: 'Liton Roy', phone: '', role: 'Batter' });
    const playerId = added.teams[0].players[0].id;
    await lockRosters(T, 'me');
    await expect(removePlayer(T, 'me', teamId, playerId)).rejects.toThrow('The rosters are locked. Give a reason for this change.');
    const removed = await removePlayer(T, 'me', teamId, playerId, 'Injury');
    expect(removed.teams[0].players).toEqual([]);
    const replaced = await addMemberPlayer(T, 'me', teamId, rafi, 'Batter', 'Injury replacement');
    expect(replaced.teams[0].players[0].addedDuringTournament).toBe(true);
    expect(replaced.audit.map((e) => [e.action, e.playerName, e.reason, e.teamName])).toEqual([
      ['player_added', 'Rafi Hasan', 'Injury replacement', 'Strikers'],
      ['player_removed', 'Liton Roy', 'Injury', 'Strikers'],
    ]);
  });

  it('lets a guest claim their profile once, through the link', async () => {
    const teamId = await ownedTeam();
    const roster = await addGuestPlayer(T, 'me', teamId, { name: 'Liton Roy', phone: '', role: 'Bowler' });
    const token = roster.teams[0].players[0].claimToken ?? '';
    expect(await findClaim(token)).toEqual({ token, playerName: 'Liton Roy', role: 'Bowler', teamName: 'Strikers', tournamentName: 'Gully Cup', claimed: false });
    expect(await findClaim('unknown')).toBeNull();
    const claimed = await claimGuestProfile(token, rafi);
    expect(claimed.claimed).toBe(true);
    await expect(claimGuestProfile(token, rafi)).rejects.toThrow('This profile has already been claimed.');
    const after = await fetchRoster(T, me);
    expect(after.teams[0].players[0].userId).toBe('u-rafi');
  });

  it('refuses a claim from someone already in a squad of the same tournament', async () => {
    const teamId = await ownedTeam();
    await addMemberPlayer(T, 'me', teamId, rafi, 'Batter');
    const roster = await addGuestPlayer(T, 'me', teamId, { name: 'Ringer', phone: '', role: 'Batter' });
    const token = roster.teams[0].players[1].claimToken ?? '';
    await expect(claimGuestProfile(token, rafi)).rejects.toThrow('You are already in a squad in this tournament.');
  });
});
