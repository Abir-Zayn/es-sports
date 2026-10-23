// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { HeadToHead } from '@/types/cricket';

import { kings, strikers } from './sample-teams';

export const strikersVsKings: HeadToHead = {
  teamA: strikers,
  teamB: kings,
  figures: {
    all: {
      played: 6,
      winsA: 4,
      winsB: 2,
      stats: [
        { label: 'Highest total', a: 189, b: 172 },
        { label: 'Lowest total', a: 112, b: 98 },
        { label: 'Average score', a: 158, b: 147 },
        { label: 'Sixes hit', a: 38, b: 29 },
        { label: 'Wickets taken', a: 41, b: 37 },
      ],
    },
    season: {
      played: 3,
      winsA: 2,
      winsB: 1,
      stats: [
        { label: 'Highest total', a: 189, b: 165 },
        { label: 'Lowest total', a: 141, b: 98 },
        { label: 'Average score', a: 164, b: 139 },
        { label: 'Sixes hit', a: 21, b: 12 },
        { label: 'Wickets taken', a: 22, b: 18 },
      ],
    },
  },
  meetings: [
    { id: 'h1', winner: 'a', result: 'Strikers won by 6 wickets', meta: 'HSF Premier League 2025 · Final' },
    { id: 'h2', winner: 'b', result: 'Kings won by 12 runs', meta: 'HSF Premier League 2025 · League' },
    { id: 'h3', winner: 'a', result: 'Strikers won by 31 runs', meta: 'Friendly · 14 Aug 2025' },
  ],
};
