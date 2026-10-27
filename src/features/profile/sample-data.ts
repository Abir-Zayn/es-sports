import type { ProfileData } from '@/types/profile';

/** Stand-in until Supabase has a `profiles` table and a stats feed. */
export const sampleProfile: ProfileData = {
  profile: {
    id: 'me',
    fullName: 'Tanvir Rahman',
    area: 'Halishahar',
    district: 'Chattogram',
    bloodGroup: 'B+',
    phone: '01712345678',
    nationalId: '1990123456789',
    role: 'all-rounder',
    battingStyle: 'right',
  },
  batting: { matches: 24, innings: 22, runs: 612, highest: '78*', average: '34.0', strikeRate: '128.4', fifties: 3, hundreds: 0 },
  bowling: { matches: 24, overs: '62.4', wickets: 18, best: '4/18', economy: '6.8', average: '23.7', threeW: 2, fiveW: 0 },
  teams: [
    { short: 'CS', name: 'Chattogram Strikers', tone: 'blue' },
    { short: 'HH', name: 'Halishahar Hawks', tone: 'yellow' },
  ],
  recent: [
    { id: 'p1', date: '22 Oct', opponent: 'vs Agrabad Titans', bat: '45 (32)', bowl: '2/24 (4)', won: true },
    { id: 'p2', date: '18 Oct', opponent: 'vs Patenga Riders', bat: '12 (14)', won: false },
    { id: 'p3', date: '11 Oct', opponent: 'vs Port City Warriors', bat: '78* (51)', bowl: '1/30 (3)', won: true },
  ],
};
