// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { StatBoard, StatLeader, StatMode } from '@/types/cricket';

const leader = (
  rank: number,
  initials: string,
  name: string,
  team: string,
  value: string,
  secondary: string,
): StatLeader => ({ rank, initials, name, team, value, secondary });

export const statBoards: Record<StatMode, StatBoard> = {
  bat: {
    unit: 'runs',
    valueHeading: 'RUNS',
    secondaryHeading: 'SR',
    categories: ['Most runs', 'Highest score', 'Most sixes', 'Best SR'],
    leaders: [
      leader(1, 'RH', 'Rafi Hasan', 'Ch. Strikers', '312', '148.6'),
      leader(2, 'SA', 'Sabbir Ahmed', 'Karnaphuli Kings', '268', '132.0'),
      leader(3, 'TI', 'Tamim Iqbal Jr', 'Patenga Riders', '241', '121.7'),
      leader(4, 'MK', 'Mahin Khan', 'Halishahar Hawks', '219', '139.5'),
      leader(5, 'AR', 'Arif Rahman', 'Agrabad Titans', '204', '117.2'),
      leader(6, 'JH', 'Jubair Hossain', 'Port City Warriors', '188', '126.1'),
      leader(7, 'SK', 'Shakil Karim', 'Bayazid Blasters', '171', '110.3'),
    ],
  },
  bowl: {
    unit: 'wkts',
    valueHeading: 'WKTS',
    secondaryHeading: 'ECON',
    categories: ['Most wickets', 'Best figures', 'Economy', 'Dot balls'],
    leaders: [
      leader(1, 'NI', 'Nayeem Islam', 'Ch. Strikers', '14', '6.20'),
      leader(2, 'FR', 'Fahim Rahman', 'Karnaphuli Kings', '12', '6.85'),
      leader(3, 'TS', 'Tanzid Sarkar', 'Halishahar Hawks', '11', '7.10'),
      leader(4, 'RM', 'Rubel Mia', 'Patenga Riders', '10', '7.45'),
      leader(5, 'HB', 'Hasan Babu', 'Agrabad Titans', '9', '6.95'),
      leader(6, 'MS', 'Mehedi Shuvo', 'Kalurghat Lions', '8', '8.02'),
      leader(7, 'AK', 'Al Amin Kabir', 'Port City Warriors', '7', '7.60'),
    ],
  },
};
