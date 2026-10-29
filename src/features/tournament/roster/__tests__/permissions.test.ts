import {
  capabilitiesOf,
  createTeamProblem,
  disbandProblem,
  moderatorInviteProblem,
  roleIn,
  suggestShortName,
  teamOwnerInviteProblem,
} from '../permissions';
import { roster, team, user } from '../__fixtures__/roster-fixture';

describe('tournament roles', () => {
  it('gives the owner everything, a moderator teams and alerts only, anyone else nothing', () => {
    expect(capabilitiesOf('owner')).toEqual({
      manageStaff: true, manageTeams: true, disbandTeams: true, manageSchedule: true, manageRegistration: true, seeSquadAlerts: true,
    });
    expect(capabilitiesOf('moderator')).toEqual({
      manageStaff: false, manageTeams: true, disbandTeams: false, manageSchedule: false, manageRegistration: false, seeSquadAlerts: true,
    });
    expect(Object.values(capabilitiesOf(null)).every((allowed) => !allowed)).toBe(true);
  });

  it('counts a moderator only after they accept', () => {
    const r = roster({
      staff: [
        { user: user('owner'), role: 'owner', status: 'accepted' },
        { user: user('m1'), role: 'moderator', status: 'pending' },
        { user: user('m2'), role: 'moderator', status: 'accepted' },
      ],
    });
    expect(roleIn(r, 'm1')).toBeNull();
    expect(roleIn(r, 'm2')).toBe('moderator');
    expect(roleIn(r, 'stranger')).toBeNull();
  });
});

describe('moderator invites', () => {
  it('lets only the owner invite, and holds two slots including pending invites', () => {
    expect(moderatorInviteProblem(roster(), 'moderator', 'x')).toMatch(/Only the tournament owner/);
    const full = roster({
      staff: [
        { user: user('owner'), role: 'owner', status: 'accepted' },
        { user: user('m1'), role: 'moderator', status: 'accepted' },
        { user: user('m2'), role: 'moderator', status: 'pending' },
      ],
    });
    expect(moderatorInviteProblem(full, 'owner', 'm3')).toMatch(/at most 2/);
    expect(moderatorInviteProblem(roster(), 'owner', 'owner')).toMatch(/already on the tournament staff/);
    expect(moderatorInviteProblem(roster(), 'owner', 'm1')).toBeNull();
  });
});

describe('teams', () => {
  const one = roster({ teams: [team('a', { name: 'Chattogram Strikers', short: 'CS', owner: { user: user('o1'), status: 'pending' } })] });

  it('lets the owner and moderators add teams up to the team count, with unique names', () => {
    expect(createTeamProblem(one, null, { name: 'Kings', short: 'KK' })).toMatch(/owner or a moderator/);
    expect(createTeamProblem(one, 'moderator', { name: 'Kings', short: 'KK' })).toBeNull();
    expect(createTeamProblem(one, 'owner', { name: 'chattogram strikers', short: 'XX' })).toMatch(/already exists/);
    expect(createTeamProblem(one, 'owner', { name: 'Kings', short: 'CS' })).toMatch(/short name/);
    expect(createTeamProblem(one, 'owner', { name: 'Kings', short: 'k' })).toMatch(/2 to 4 capital letters/);
    expect(createTeamProblem(one, 'owner', { name: 'K', short: 'KK' })).toMatch(/2 to 40/);
    expect(createTeamProblem(roster({ maxTeams: 1, teams: one.teams }), 'owner', { name: 'Kings', short: 'KK' })).toMatch(/set to 1 teams/);
  });

  it('gives each team one owner, and each person at most one team', () => {
    const two = roster({ teams: [...one.teams, team('b', { name: 'Kings', short: 'KK' })] });
    expect(teamOwnerInviteProblem(two, 'owner', 'a', 'o2')).toMatch(/already has an owner/);
    expect(teamOwnerInviteProblem(two, 'owner', 'b', 'o1')).toMatch(/already owns a team/);
    expect(teamOwnerInviteProblem(two, 'moderator', 'b', 'o2')).toBeNull();
    expect(teamOwnerInviteProblem(two, null, 'b', 'o2')).toMatch(/owner or a moderator/);
    expect(teamOwnerInviteProblem(two, 'owner', 'gone', 'o2')).toMatch(/no longer exists/);
  });

  it('lets only the owner disband a team', () => {
    expect(disbandProblem('owner')).toBeNull();
    expect(disbandProblem('moderator')).toMatch(/Only the tournament owner/);
  });

  it('suggests a short name from the team name', () => {
    expect(suggestShortName('Chattogram Strikers')).toBe('CS');
    expect(suggestShortName('Port City Warriors XI')).toBe('PCWX');
    expect(suggestShortName('Kings')).toBe('KIN');
    expect(suggestShortName('  ')).toBe('');
  });
});
