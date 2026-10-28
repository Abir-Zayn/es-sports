// Stand-in for the scheduled rows of the `matches` table until the Matches tab reads from Supabase.
import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from '@/features/tournament/sample-teams';
import type { Fixture } from '@/types/cricket';

/** Every match still to play, across tournaments and friendlies, soonest first. */
export const sampleUpcomingMatches: Fixture[] = [
  {
    id: 'm13',
    state: 'upcoming',
    title: 'Chattogram Premier League, Match 13',
    date: '2026-10-31',
    day: 'Sat, 31 Oct',
    time: '4:00 PM',
    sides: [
      { team: riders, score: '', emphasised: true },
      { team: titans, score: '', emphasised: true },
    ],
    note: 'Halishahar Ground',
  },
  {
    id: 'm14',
    state: 'upcoming',
    title: 'Chattogram Premier League, Match 14',
    date: '2026-11-01',
    day: 'Sun, 1 Nov',
    time: '9:30 AM',
    sides: [
      { team: warriors, score: '', emphasised: true },
      { team: lions, score: '', emphasised: true },
    ],
    note: 'Halishahar Ground',
  },
  {
    id: 'f21',
    state: 'upcoming',
    title: 'Friendly',
    date: '2026-11-01',
    day: 'Sun, 1 Nov',
    time: '3:00 PM',
    sides: [
      { team: strikers, score: '', emphasised: true },
      { team: hawks, score: '', emphasised: true },
    ],
    note: 'MA Aziz Stadium',
  },
  {
    id: 'm15',
    state: 'upcoming',
    title: 'Chattogram Premier League, Match 15',
    date: '2026-11-07',
    day: 'Sat, 7 Nov',
    time: '2:30 PM',
    sides: [
      { team: blasters, score: '', emphasised: true },
      { team: kings, score: '', emphasised: true },
    ],
    note: 'Halishahar Ground',
  },
  {
    id: 'w03',
    state: 'upcoming',
    title: 'Port City Winter Cup, Match 3',
    date: '2026-12-12',
    day: 'Sat, 12 Dec',
    time: '10:00 AM',
    sides: [
      { team: kings, score: '', emphasised: true },
      { team: strikers, score: '', emphasised: true },
    ],
    note: 'Zahur Ahmed Chowdhury Stadium',
  },
  {
    id: 'w07',
    state: 'upcoming',
    title: 'Port City Winter Cup, Match 7',
    date: '2027-01-09',
    day: 'Sat, 9 Jan',
    time: '1:00 PM',
    sides: [
      { team: titans, score: '', emphasised: true },
      { team: warriors, score: '', emphasised: true },
    ],
    note: 'Zahur Ahmed Chowdhury Stadium',
  },
];
