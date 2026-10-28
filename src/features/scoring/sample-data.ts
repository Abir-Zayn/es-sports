import { matchInfo } from '@/features/match/sample-info';

import type { MatchSetup, ScorerTeam, TeamCode } from './types';

// Local UI preview. Replace with the scorer's assigned match and confirmed squads.
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
export const otherTeam = (team: TeamCode): TeamCode => team === 'KK' ? 'CS' : 'KK';
export const battingFirst = (setup: MatchSetup): TeamCode =>
  setup.decision === 'bat' ? setup.tossWinner : otherTeam(setup.tossWinner);
export const initialSetup: MatchSetup = {
  tossWinner: 'KK', decision: 'bat', recordShots: true, oversLimit: 20,
  playingXi: {
    KK: scorerTeams.KK.players.slice(0, 11).map((p) => p.id),
    CS: scorerTeams.CS.players.slice(0, 11).map((p) => p.id),
  },
  strikerId: 'KK-0', nonStrikerId: 'KK-1', bowlerId: 'CS-10',
};

export const playerName = (id: string): string =>
  [...scorerTeams.KK.players, ...scorerTeams.CS.players].find((p) => p.id === id)?.name ?? 'Choose player';
