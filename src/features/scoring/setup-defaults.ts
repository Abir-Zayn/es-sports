import type { MatchSetup, TeamCode } from './types';

export const teamCodes: readonly TeamCode[] = ['KK', 'CS'];
export const otherTeam = (team: TeamCode): TeamCode => team === 'KK' ? 'CS' : 'KK';
export const battingFirst = (setup: MatchSetup): TeamCode =>
  setup.decision === 'bat' ? setup.tossWinner : otherTeam(setup.tossWinner);

/** An empty setup. Every scored match replaces it with its own teams and squads. */
export const initialSetup: MatchSetup = {
  title: '',
  teams: {
    KK: { team: { short: 'TA', name: 'Team A', tone: 'blue' }, players: [] },
    CS: { team: { short: 'TB', name: 'Team B', tone: 'yellow' }, players: [] },
  },
  playersPerSide: 11, preset: false, tossWinner: 'KK', decision: 'bat', recordShots: true, oversLimit: 20,
  playingXi: { KK: [], CS: [] }, strikerId: '', nonStrikerId: '', bowlerId: '',
};

export const playerName = (setup: MatchSetup, id: string): string =>
  [...setup.teams.KK.players, ...setup.teams.CS.players].find((p) => p.id === id)?.name ?? 'Choose player';
