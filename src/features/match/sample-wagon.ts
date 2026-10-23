// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { Shot, WagonBatter } from './types';

const shots = (pairs: [number, number][]): Shot[] => pairs.map(([runs, angle]) => ({ runs, angle }));

export const wagonBatters: WagonBatter[] = [
  {
    id: 'rafi',
    name: 'Rafi Hasan',
    line: '68* (41) · 6×4, 3×6',
    shots: shots([
      [4, -30], [4, 0], [4, -38], [4, -90], [4, 180], [4, 120],
      [6, -150], [6, -110], [6, -140],
      [1, -60], [1, -120], [1, 20], [1, 150], [1, -10], [1, -100], [1, 160], [1, 45], [1, -75], [1, 200], [1, -160], [1, 100], [1, -45], [1, 210],
      [2, -25], [2, -130], [2, 170], [2, 30], [2, -95], [2, 135],
    ]),
  },
  {
    id: 'imran',
    name: 'Imran Kayes',
    line: '22* (15) · 2×4, 1×6',
    shots: shots([[4, 175], [4, -45], [6, -120], [1, -70], [1, 15], [1, 160], [1, -140], [1, 110], [1, -20], [2, -100]]),
  },
];
