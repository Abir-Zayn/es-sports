import type { Delivery, DeliveryInput, ScoreState } from '../types';

export const oversLabel = (balls: number) => `${Math.floor(balls / 6)}.${balls % 6}`;
export const bowlerQuota = (score: ScoreState) => Math.ceil(score.oversLimit / 5) * 6;
export const swapEnds = (score: ScoreState): ScoreState => ({
  ...score, strikerId: score.nonStrikerId, nonStrikerId: score.strikerId,
});

export function chooseBowler(score: ScoreState, id: string): ScoreState {
  const bowler = score.bowlers[id];
  if (!score.awaitingBowler || !bowler || score.complete ||
      score.lastOver?.bowlerId === id || bowler.balls >= bowlerQuota(score)) {
    throw new Error('Choose an eligible bowler who did not bowl the previous over.');
  }
  return { ...score, bowlerId: id, awaitingBowler: false };
}

function validateWicket(score: ScoreState, input: DeliveryInput) {
  const { dismissal, outId, nextBatterId, fielderId, runs } = input;
  if (!dismissal || !outId || ![score.strikerId, score.nonStrikerId].includes(outId)) {
    throw new Error('Choose the dismissed batter.');
  }
  if ((outId !== score.strikerId || score.freeHit) && dismissal !== 'Run out') {
    throw new Error('Only a run out is available for this batter or free hit.');
  }
  if (dismissal !== 'Run out' && runs !== 0) throw new Error('Only completed run-out runs can be recorded.');
  if (['Caught', 'Stumped', 'Run out'].includes(dismissal) && !score.bowlers[fielderId ?? '']) {
    throw new Error('Choose the fielder.');
  }
  if (score.wickets < 9 && (!nextBatterId || !score.batters[nextBatterId] ||
      score.batters[nextBatterId].out || [score.strikerId, score.nonStrikerId].includes(nextBatterId))) {
    throw new Error('Choose a batter who has not been dismissed and is not at the crease.');
  }
}

export function applyDelivery(score: ScoreState, input: DeliveryInput, id: string): ScoreState {
  if (score.complete || score.awaitingBowler) throw new Error('Complete the current step before recording a ball.');
  if (!Number.isInteger(input.runs) || input.runs < 0 || input.runs > 6) throw new Error('Choose a valid run count.');
  if (input.kind === 'dead') return score;
  if (input.kind === 'wicket') validateWicket(score, input);
  if (['bye', 'leg-bye'].includes(input.kind) && input.runs === 0) throw new Error('Enter at least one extra.');
  const legal = input.kind !== 'wide' && input.kind !== 'no-ball';
  const penalty = legal ? 0 : 1;
  const total = input.runs + penalty;
  const batRuns = ['runs', 'no-ball', 'wicket'].includes(input.kind) ? input.runs : 0;
  const labels = { runs: String(input.runs), wide: 'Wd', 'no-ball': 'Nb', bye: 'B', 'leg-bye': 'Lb', wicket: 'W' };
  const delivery: Delivery = {
    ...input, id, total, legal, label: labels[input.kind],
    batterId: score.strikerId, bowlerId: score.bowlerId,
    ball: oversLabel(score.balls + (legal ? 1 : 0)),
  };
  const batter = score.batters[score.strikerId];
  const bowler = score.bowlers[score.bowlerId];
  const deliveries = [...score.currentOver, delivery];
  let next: ScoreState = {
    ...score, runs: score.runs + total, balls: score.balls + Number(legal),
    wickets: score.wickets + Number(input.kind === 'wicket'),
    freeHit: input.kind === 'no-ball' || (!legal && score.freeHit),
    batters: { ...score.batters, [batter.id]: {
      // A no-ball is faced by the batter, but is not a legal ball in the over.
      ...batter, runs: batter.runs + batRuns, balls: batter.balls + Number(input.kind !== 'wide'),
    } },
    bowlers: { ...score.bowlers, [bowler.id]: {
      ...bowler, balls: bowler.balls + Number(legal),
      runs: bowler.runs + (input.kind === 'bye' || input.kind === 'leg-bye' ? 0 : total),
      wickets: bowler.wickets + Number(input.kind === 'wicket' && input.dismissal !== 'Run out'),
    } },
    currentOver: deliveries,
  };
  if (input.runs % 2 === 1) next = swapEnds(next);
  if (input.kind === 'wicket' && input.outId) {
    next.batters[input.outId] = { ...next.batters[input.outId], out: true };
    if (input.nextBatterId && next.wickets < 10) {
      if (next.strikerId === input.outId) next.strikerId = input.nextBatterId;
      else next.nonStrikerId = input.nextBatterId;
    }
  }
  next.complete = next.wickets >= 10 || next.balls >= next.oversLimit * 6 ||
    (next.target !== null && next.runs >= next.target);
  if (legal && next.balls % 6 === 0) {
    next = swapEnds(next);
    next.lastOver = {
      number: next.balls / 6, runs: deliveries.reduce((sum, d) => sum + d.total, 0),
      deliveries, bowlerId: score.bowlerId,
    };
    next.currentOver = [];
    next.awaitingBowler = !next.complete;
  }
  return next;
}
