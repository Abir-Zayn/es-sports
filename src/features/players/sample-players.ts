import { sampleCareer, sampleProfile } from '@/features/profile';
import { emptyCareer } from '@/lib/career-stats';
import type { PlayerCareer } from './types';

const tanvir: PlayerCareer = {
  profile: { ...sampleProfile.profile, id: '11111111-1111-4111-8111-000000000001', fullName: 'Tanvir Ahmed' },
  jerseyNumber: 18, totals: sampleCareer,
  shots: [{ runs: 32, angle: 0 }, { runs: 24, angle: 270 }, { runs: 20, angle: 180 }, { runs: 12, angle: 90 }],
  recent: sampleProfile.recent, isSample: true,
};
const liton: PlayerCareer = {
  profile: { id: '11111111-1111-4111-8111-000000000002', fullName: 'Liton Roy', area: 'Agrabad', district: 'Chattogram', role: 'batter', battingStyle: 'right' },
  jerseyNumber: 16, totals: { ...emptyCareer, matches: 18, innings: 17, notOuts: 3, runs: 480, ballsFaced: 390, highest: 81,
    highestNotOut: true, fifties: 3, ballsBowled: 30, runsConceded: 27, wickets: 2, best: { wickets: 2, runs: 12 } },
  shots: [{ runs: 36, angle: 0 }, { runs: 28, angle: 270 }, { runs: 20, angle: 180 }, { runs: 16, angle: 90 }],
  recent: [{ id: 'liton-1', date: '22 Oct', opponent: 'vs Halishahar Strikers', bat: '53 (39)', won: false }], isSample: true,
};
const rashedul: PlayerCareer = {
  profile: { id: '11111111-1111-4111-8111-000000000003', fullName: 'Rashedul Islam', area: 'Pahartali', district: 'Chattogram', role: 'bowler', battingStyle: 'left' },
  jerseyNumber: 23, totals: { ...emptyCareer, matches: 16, innings: 8, notOuts: 3, runs: 92, ballsFaced: 80, highest: 29,
    ballsBowled: 312, runsConceded: 310, wickets: 24, best: { wickets: 4, runs: 14 }, threeW: 2 },
  shots: [{ runs: 12, angle: 0 }, { runs: 18, angle: 270 }, { runs: 12, angle: 180 }, { runs: 6, angle: 90 }],
  recent: [{ id: 'rashedul-1', date: '22 Oct', opponent: 'vs Agrabad Tigers', bowl: '2/14 (4)', won: true }], isSample: true,
};
const players = [tanvir, liton, rashedul];

export function findSamplePlayer(id: string): PlayerCareer | undefined {
  if (id === 'me' || id === sampleProfile.profile.fullName) {
    return { ...tanvir, profile: sampleProfile.profile };
  }
  return players.find((player) => player.profile.id === id || player.profile.fullName === id);
}
