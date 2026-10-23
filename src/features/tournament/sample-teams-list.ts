// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { TournamentTeam } from '@/types/cricket';

import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from './sample-teams';

/** In table order. */
export const tournamentTeams: TournamentTeam[] = [
  { team: strikers, pos: 1, captain: 'Rafi Hasan', players: 15, points: 8 },
  { team: kings, pos: 2, captain: 'Sabbir Ahmed', players: 16, points: 8 },
  { team: riders, pos: 3, captain: 'Rubel Mia', players: 14, points: 6 },
  { team: hawks, pos: 4, captain: 'Mahin Khan', players: 15, points: 6 },
  { team: titans, pos: 5, captain: 'Arif Rahman', players: 14, points: 4 },
  { team: warriors, pos: 6, captain: 'Jubair Hossain', players: 15, points: 4 },
  { team: blasters, pos: 7, captain: 'Shakil Karim', players: 13, points: 2 },
  { team: lions, pos: 8, captain: 'Mehedi Shuvo', players: 14, points: 2 },
];
