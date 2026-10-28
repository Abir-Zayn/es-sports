import type { DeliveryInput, ScoreState } from './types';

export function wicketDescription(score: ScoreState, input: DeliveryInput) {
  const batter = score.batters[input.outId ?? score.strikerId];
  const bowler = score.bowlers[score.bowlerId].name.split(' ')[0];
  const fielder = score.bowlers[input.fielderId ?? '']?.name ?? 'fielder';
  const how = input.dismissal === 'Caught' ? `c ${fielder} b ${bowler}` :
    input.dismissal === 'Stumped' ? `st ${fielder} b ${bowler}` :
    input.dismissal === 'Run out' ? `run out (${fielder})` :
    input.dismissal === 'Caught & bowled' ? `c & b ${bowler}` :
    input.dismissal === 'LBW' ? `lbw b ${bowler}` :
    input.dismissal === 'Hit wicket' ? `hit wicket b ${bowler}` : `b ${bowler}`;
  const faced = batter.balls + Number(batter.id === score.strikerId);
  const runs = batter.runs + (batter.id === score.strikerId ? input.runs : 0);
  return `${batter.name} ${how} ${runs} (${faced})`;
}
