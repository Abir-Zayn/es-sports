import { getLocale, translate, type Locale } from '@/i18n';

import type { DeliveryInput, ScoreState } from './types';

export function wicketDescription(score: ScoreState, input: DeliveryInput, locale: Locale = getLocale()) {
  const batter = score.batters[input.outId ?? score.strikerId];
  const bowler = score.bowlers[score.bowlerId].name.split(' ')[0];
  const fielder = score.bowlers[input.fielderId ?? '']?.name ?? translate(locale, 'scoring.wicket.fielderFallback');
  const how = input.dismissal === 'Unspecified' ? translate(locale, 'match.dismissal.out') :
    input.dismissal === 'Caught' ? translate(locale, 'match.dismissal.caught', { fielder, bowler }) :
    input.dismissal === 'Stumped' ? translate(locale, 'match.dismissal.stumped', { fielder, bowler }) :
    input.dismissal === 'Run out' ? translate(locale, 'match.dismissal.runOutFielder', { fielder }) :
    input.dismissal === 'Caught & bowled' ? translate(locale, 'match.dismissal.caughtAndBowled', { bowler }) :
    input.dismissal === 'LBW' ? translate(locale, 'match.dismissal.lbw', { bowler }) :
    input.dismissal === 'Hit wicket' ? translate(locale, 'match.dismissal.hitWicket', { bowler }) :
    translate(locale, 'match.dismissal.bowled', { bowler });
  const faced = batter.balls + Number(batter.id === score.strikerId);
  const runs = batter.runs + (batter.id === score.strikerId ? input.runs : 0);
  return `${batter.name} ${how} ${runs} (${faced})`;
}
