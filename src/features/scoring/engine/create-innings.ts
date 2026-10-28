import { battingFirst, otherTeam, scorerTeams } from '../sample-data';
import type { MatchSetup, ScoreState } from '../types';

export function createInnings(setup: MatchSetup, previous?: ScoreState): ScoreState {
  if (previous && (!previous.complete || previous.innings !== 1)) throw new Error('Finish the first innings first.');
  const battingTeam = previous ? previous.bowlingTeam : battingFirst(setup);
  const bowlingTeam = otherTeam(battingTeam);
  if (Object.values(setup.playingXi).some((ids) => ids.length !== 11 || new Set(ids).size !== 11)) {
    throw new Error('Select eleven different players for each team.');
  }
  if (setup.strikerId === setup.nonStrikerId ||
      !setup.playingXi[battingTeam].includes(setup.strikerId) ||
      !setup.playingXi[battingTeam].includes(setup.nonStrikerId) ||
      !setup.playingXi[bowlingTeam].includes(setup.bowlerId)) {
    throw new Error('Choose two different opening batters and a bowler from the opposing team.');
  }
  return {
    innings: previous ? 2 : 1, battingTeam, bowlingTeam, playingXi: setup.playingXi,
    batters: Object.fromEntries(scorerTeams[battingTeam].players
      .filter((p) => setup.playingXi[battingTeam].includes(p.id))
      .map((p) => [p.id, { ...p, runs: 0, balls: 0, out: false }])),
    bowlers: Object.fromEntries(scorerTeams[bowlingTeam].players
      .filter((p) => setup.playingXi[bowlingTeam].includes(p.id))
      .map((p) => [p.id, { ...p, balls: 0, runs: 0, wickets: 0 }])),
    strikerId: setup.strikerId, nonStrikerId: setup.nonStrikerId, bowlerId: setup.bowlerId,
    runs: 0, wickets: 0, balls: 0, oversLimit: setup.oversLimit, freeHit: false,
    target: previous ? previous.runs + 1 : null,
    awaitingBowler: false, complete: false, currentOver: [], lastOver: null,
    previousInnings: previous ? {
      team: previous.battingTeam, runs: previous.runs, wickets: previous.wickets, balls: previous.balls,
    } : null,
  };
}
