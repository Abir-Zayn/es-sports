// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { Fixture, TeamInfo } from '@/types/cricket';

import { blasters, hawks, kings, lions, riders, strikers, titans, warriors } from './sample-teams';

/** Stands in for a team that the league table has not decided yet. */
const seed = (short: string, name: string): TeamInfo => ({ short, name, tone: 'neutral' });

const GROUND = 'Halishahar Ground';

/** The whole schedule in one list. Matches on the same day sit together; results run newest first. */
export const tournamentFixtures: Fixture[] = [
  {
    id: 'm12',
    state: 'live',
    title: 'Match 12',
    date: '2025-10-23',
    day: 'Today',
    sides: [
      { team: kings, score: '168/7', overs: '20', emphasised: false },
      { team: strikers, score: '142/4', overs: '16.3', emphasised: true },
    ],
    note: 'Strikers need 27 runs from 21 balls',
  },
  {
    id: 'm13',
    state: 'upcoming',
    title: 'Match 13',
    date: '2025-10-24',
    day: 'Fri, 24 Oct',
    time: '4:00 PM',
    sides: [
      { team: riders, score: '', emphasised: true },
      { team: titans, score: '', emphasised: true },
    ],
    note: GROUND,
  },
  {
    id: 'm14',
    state: 'upcoming',
    title: 'Match 14',
    date: '2025-10-25',
    day: 'Sat, 25 Oct',
    time: '9:30 AM',
    sides: [
      { team: warriors, score: '', emphasised: true },
      { team: lions, score: '', emphasised: true },
    ],
    note: GROUND,
  },
  {
    id: 'm15',
    state: 'upcoming',
    title: 'Match 15',
    date: '2025-10-25',
    day: 'Sat, 25 Oct',
    time: '2:30 PM',
    sides: [
      { team: blasters, score: '', emphasised: true },
      { team: kings, score: '', emphasised: true },
    ],
    note: GROUND,
  },
  {
    id: 'sf1',
    state: 'upcoming',
    title: 'Semi-final 1',
    date: '2025-11-22',
    day: 'Sat, 22 Nov',
    time: '3:00 PM',
    sides: [
      { team: seed('1', '1st place'), score: '', emphasised: false },
      { team: seed('4', '4th place'), score: '', emphasised: false },
    ],
    note: 'Teams decided after league stage',
  },
  {
    id: 'm11',
    state: 'result',
    title: 'Match 11',
    date: '2025-10-22',
    day: 'Yesterday',
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
    title: 'Match 10',
    date: '2025-10-21',
    day: 'Tue, 21 Oct',
    time: '9:30 AM',
    sides: [
      { team: kings, score: '154/8', overs: '20', emphasised: true },
      { team: riders, score: '150/9', overs: '20', emphasised: false },
    ],
    note: 'Karnaphuli Kings won by 4 runs',
  },
];
