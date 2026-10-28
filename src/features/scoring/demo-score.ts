import { initialSetup } from './sample-data';
import { createInnings } from './engine/create-innings';
import type { ScoreState } from './types';

/** Matches the ball-entry reference, without claiming this is a live server match. */
export function createDemoScore(): ScoreState {
  const first = { ...createInnings(initialSetup), complete: true, runs: 168, wickets: 7, balls: 120 };
  const score = createInnings({ ...initialSetup, strikerId: 'CS-1', nonStrikerId: 'CS-5', bowlerId: 'KK-7' }, first);
  const batting = [['CS-1', 68, 41], ['CS-5', 22, 15]] as const;
  for (const [id, runs, balls] of batting) score.batters[id] = { ...score.batters[id], runs, balls };
  for (const id of ['CS-0', 'CS-2', 'CS-3', 'CS-4']) score.batters[id] = { ...score.batters[id], out: true };
  for (const [id, balls, runs, wickets] of [
    ['KK-7', 21, 28, 2], ['KK-5', 24, 31, 1], ['KK-4', 24, 36, 0], ['KK-6', 18, 24, 1], ['KK-0', 12, 20, 0],
  ] as const) score.bowlers[id] = { ...score.bowlers[id], balls, runs, wickets };
  return {
    ...score, runs: 142, wickets: 4, balls: 99,
    currentOver: [
      { id: 'demo-1', kind: 'runs', runs: 1, total: 1, label: '1', legal: true, batterId: 'CS-5', bowlerId: 'KK-7', ball: '16.1' },
      { id: 'demo-2', kind: 'runs', runs: 4, total: 4, label: '4', legal: true, batterId: 'CS-1', bowlerId: 'KK-7', ball: '16.2' },
      { id: 'demo-wd', kind: 'wide', runs: 0, total: 1, label: 'Wd', legal: false, batterId: 'CS-1', bowlerId: 'KK-7', ball: '16.2' },
      { id: 'demo-3', kind: 'runs', runs: 4, total: 4, label: '4', legal: true, batterId: 'CS-1', bowlerId: 'KK-7', ball: '16.3' },
    ],
  };
}
