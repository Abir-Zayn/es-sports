import { matchInfo } from '@/features/match/sample-info';

import type { MatchSetup, ScorerTeam, TeamCode } from './types';

// Local UI preview for fixtures without confirmed squads. A friendly match brings its own teams.
const makeTeam = (index: number): ScorerTeam => {
  const squad = matchInfo.squads[index];
  return {
    team: squad.team,
    players: [...squad.playingXi, ...squad.bench.map((name) => ({ name, role: 'Reserve' }))].map((p, i) => ({
      ...p, id: `${squad.team.short}-${i}`,
    })),
  };
};

export const scorerTeams: Record<TeamCode, ScorerTeam> = { KK: makeTeam(0), CS: makeTeam(1) };
export const teamCodes: readonly TeamCode[] = ['KK', 'CS'];
export const otherTeam = (team: TeamCode): TeamCode => team === 'KK' ? 'CS' : 'KK';
export const battingFirst = (setup: MatchSetup): TeamCode =>
  setup.decision === 'bat' ? setup.tossWinner : otherTeam(setup.tossWinner);
export const initialSetup: MatchSetup = {
  title: 'Match 12 · Kings vs Strikers', teams: scorerTeams, playersPerSide: 11, preset: false,
  tossWinner: 'KK', decision: 'bat', recordShots: true, oversLimit: 20,
  playingXi: {
    KK: scorerTeams.KK.players.slice(0, 11).map((p) => p.id),
    CS: scorerTeams.CS.players.slice(0, 11).map((p) => p.id),
  },
  strikerId: 'KK-0', nonStrikerId: 'KK-1', bowlerId: 'CS-10',
};

export const playerName = (setup: MatchSetup, id: string): string =>
  [...setup.teams.KK.players, ...setup.teams.CS.players].find((p) => p.id === id)?.name ?? 'Choose player';
