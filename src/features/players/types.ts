import type { CareerTotals } from '@/lib/career-stats';
import type { Performance, PlayerProfile } from '@/types/profile';

export type PlayerCareer = {
  profile: PlayerProfile;
  jerseyNumber?: number;
  totals: CareerTotals;
  shots: readonly { runs: number; angle: number }[];
  recent: readonly Performance[];
  isSample: boolean;
};
