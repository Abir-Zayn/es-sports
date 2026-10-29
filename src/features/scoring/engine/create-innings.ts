import { battingFirst, otherTeam, teamCodes } from '../sample-data';
import type { MatchSetup, ScoreState, TeamCode } from '../types';

export const MIN_SIDE = 2;
export const MAX_SIDE = 16;

export function createInnings(setup: MatchSetup, previous?: ScoreState): ScoreState {
  if (previous && (!previous.complete || previous.innings !== 1)) throw new Error('Finish the first innings first.');
  const battingTeam = previous ? previous.bowlingTeam : battingFirst(setup);
  const bowlingTeam = otherTeam(battingTeam);
  const size = setup.playersPerSide;
  const known = (code: TeamCode, id: string) => setup.teams[code].players.some((p) => p.id === id);
  if (!Number.isInteger(size) || size < MIN_SIDE || size > MAX_SIDE || teamCodes.some((code) => {
    const ids = setup.playingXi[code];
    return ids.length !== size || new Set(ids).size !== size || !ids.every((id) => known(code, id));
  })) {
    throw new Error(`Select ${size} different players for each team.`);
  }
  if (setup.strikerId === setup.nonStrikerId ||
      !setup.playingXi[battingTeam].includes(setup.strikerId) ||
      !setup.playingXi[battingTeam].includes(setup.nonStrikerId) ||
      !setup.playingXi[bowlingTeam].includes(setup.bowlerId)) {
    throw new Error('Choose two different opening batters and a bowler from the opposing team.');
  }
  const players = (code: TeamCode) => setup.teams[code].players.filter((p) => setup.playingXi[code].includes(p.id));
  return {
    innings: previous ? 2 : 1, battingTeam, bowlingTeam, playingXi: setup.playingXi,
    teams: { KK: setup.teams.KK.team, CS: setup.teams.CS.team },
    batters: Object.fromEntries(players(battingTeam).map((p) => [p.id, { ...p, runs: 0, balls: 0, fours: 0, sixes: 0, out: false }])),
    bowlers: Object.fromEntries(players(bowlingTeam).map((p) => [p.id, { ...p, balls: 0, runs: 0, wickets: 0, maidens: 0 }])),
    strikerId: setup.strikerId, nonStrikerId: setup.nonStrikerId, bowlerId: setup.bowlerId,
    runs: 0, wickets: 0, balls: 0, oversLimit: setup.oversLimit, freeHit: false,
    target: previous ? previous.runs + 1 : null,
    awaitingBowler: false, complete: false, currentOver: [], lastOver: null, shots: [],
    previousInnings: previous ? {
      team: previous.battingTeam, runs: previous.runs, wickets: previous.wickets, balls: previous.balls,
      batters: previous.batters, bowlers: previous.bowlers, shots: previous.shots,
      atCrease: [previous.strikerId, previous.nonStrikerId],
    } : null,
  };
}
