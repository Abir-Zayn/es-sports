import { useEffect, useRef, useState } from 'react';

import type { FlashStep } from './poc-overlay';
import type { LabScore } from './use-lab-score';

const FLASH_BALLS: Record<string, string> = { '4': 'FOUR', '6': 'SIX', W: 'WICKET' };
/** Three captures per flash (enter, hold, exit) instead of a tween: §6 step 5. */
const STEPS: { step: FlashStep; at: number }[] = [
  { step: 'enter', at: 0 }, { step: 'hold', at: 250 }, { step: 'exit', at: 1_200 }, { step: null, at: 1_500 },
];

export function useStepFlash(score: LabScore, enabled: boolean) {
  const [flash, setFlash] = useState<{ label: string; step: FlashStep } | null>(null);
  const seen = useRef(score.ballSeq);

  useEffect(() => {
    if (score.ballSeq === seen.current) return;
    seen.current = score.ballSeq;
    const label = score.lastBall ? FLASH_BALLS[score.lastBall] : undefined;
    if (!enabled || !label) return;
    const timers = STEPS.map(({ step, at }) => setTimeout(() => setFlash(step ? { label, step } : null), at));
    return () => timers.forEach(clearTimeout);
  }, [score.ballSeq, score.lastBall, enabled]);

  return enabled ? flash : null;
}
