// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { PointsTableData } from '@/types/cricket';

import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from './sample-teams';

export const leagueTable: PointsTableData = {
  qualifyCount: 4,
  qualifyNote: 'Qualify for semi-finals',
  rules: 'Win = 2 pts · No result = 1 pt. Ties on points are split by net run rate (NRR).',
  rows: [
    { pos: 1, team: strikers, played: 5, won: 4, lost: 1, noResult: 0, nrr: '+1.245', points: 8 },
    { pos: 2, team: kings, played: 5, won: 4, lost: 1, noResult: 0, nrr: '+0.870', points: 8 },
    { pos: 3, team: riders, played: 5, won: 3, lost: 2, noResult: 0, nrr: '+0.412', points: 6 },
    { pos: 4, team: hawks, played: 5, won: 3, lost: 2, noResult: 0, nrr: '-0.105', points: 6 },
    { pos: 5, team: titans, played: 5, won: 2, lost: 2, noResult: 1, nrr: '+0.050', points: 5 },
    { pos: 6, team: warriors, played: 5, won: 2, lost: 3, noResult: 0, nrr: '-0.330', points: 4 },
    { pos: 7, team: blasters, played: 5, won: 1, lost: 3, noResult: 1, nrr: '-0.910', points: 3 },
    { pos: 8, team: lions, played: 5, won: 1, lost: 4, noResult: 0, nrr: '-1.180', points: 2 },
  ],
};
