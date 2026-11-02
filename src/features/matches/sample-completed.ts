import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from '@/features/tournament/sample-teams';
import type { Fixture } from '@/types/cricket';

/** Recent completed matches shown when offline or when no server matches have finished. */
export const sampleCompletedMatches: Fixture[] = [
  {
    id: 'm11',
    state: 'result',
    title: 'Chattogram Premier League, Match 11',
    date: '2026-10-30',
    day: 'Fri, 30 Oct',
    time: '3:00 PM',
    sides: [
      { team: strikers, score: '176/6', overs: '20', emphasised: true },
      { team: hawks, score: '158/9', overs: '20', emphasised: false },
    ],
    note: 'Strikers won by 18 runs',
  },
  {
    id: 'm10',
    state: 'result',
    title: 'Chattogram Premier League, Match 10',
    date: '2026-10-29',
    day: 'Thu, 29 Oct',
    time: '9:30 AM',
    sides: [
      { team: kings, score: '154/8', overs: '20', emphasised: true },
      { team: riders, score: '150/9', overs: '20', emphasised: false },
    ],
    note: 'Karnaphuli Kings won by 4 runs',
  },
  {
    id: 'm09',
    state: 'result',
    title: 'Chattogram Premier League, Match 9',
    date: '2026-10-28',
    day: 'Wed, 28 Oct',
    time: '2:00 PM',
    sides: [
      { team: warriors, score: '162/5', overs: '20', emphasised: true },
      { team: lions, score: '138/9', overs: '20', emphasised: false },
    ],
    note: 'Warriors won by 24 runs',
  },
  {
    id: 'm08',
    state: 'result',
    title: 'Chattogram Premier League, Match 8',
    date: '2026-10-27',
    day: 'Tue, 27 Oct',
    time: '10:00 AM',
    sides: [
      { team: blasters, score: '185/4', overs: '20', emphasised: true },
      { team: titans, score: '142/8', overs: '20', emphasised: false },
    ],
    note: 'Blasters won by 43 runs',
  },
];
