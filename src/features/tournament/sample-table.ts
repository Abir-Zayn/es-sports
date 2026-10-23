// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { PointsTableData } from '@/types/cricket';

import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from './sample-teams';

export const leagueTable: PointsTableData = {
  title: 'League stage',
  progress: 'After 11 matches',
  qualifyCount: 4,
  qualifyNote: 'Top 4 qualify for semi-finals',
  rules: 'Win = 2 pts · No result = 1 pt. Ties on points are split by net run rate (NRR).',
  rows: [
    { pos: 1, team: strikers, played: 5, won: 4, lost: 1, nrr: '+1.245', points: 8, form: ['W', 'W', 'L', 'W', 'W'] },
    { pos: 2, team: kings, played: 5, won: 4, lost: 1, nrr: '+0.870', points: 8, form: ['W', 'L', 'W', 'W', 'W'] },
    { pos: 3, team: riders, played: 5, won: 3, lost: 2, nrr: '+0.412', points: 6, form: ['L', 'W', 'W', 'L', 'W'] },
    { pos: 4, team: hawks, played: 5, won: 3, lost: 2, nrr: '-0.105', points: 6, form: ['W', 'W', 'L', 'W', 'L'] },
    { pos: 5, team: titans, played: 5, won: 2, lost: 3, nrr: '+0.050', points: 4, form: ['L', 'L', 'W', 'W', 'L'] },
    { pos: 6, team: warriors, played: 5, won: 2, lost: 3, nrr: '-0.330', points: 4, form: ['W', 'L', 'L', 'L', 'W'] },
    { pos: 7, team: blasters, played: 5, won: 1, lost: 4, nrr: '-0.910', points: 2, form: ['L', 'W', 'L', 'L', 'L'] },
    { pos: 8, team: lions, played: 5, won: 1, lost: 4, nrr: '-1.180', points: 2, form: ['L', 'L', 'L', 'W', 'L'] },
  ],
  semis: [
    {
      id: 'sf1',
      label: 'SEMI-FINAL 1 · 22 NOV',
      sides: [
        { seed: '1', name: 'Ch. Strikers', tone: 'blue' },
        { seed: '4', name: 'Hal. Hawks', tone: 'yellow' },
      ],
    },
    {
      id: 'sf2',
      label: 'SEMI-FINAL 2 · 23 NOV',
      sides: [
        { seed: '2', name: 'Karnaphuli K.', tone: 'yellow' },
        { seed: '3', name: 'Patenga R.', tone: 'blue' },
      ],
    },
  ],
  final: { date: 'Sun 30 Nov · 3:00 PM', caption: 'Winner SF1 vs Winner SF2' },
};
