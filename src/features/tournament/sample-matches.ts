// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { FixtureGroup, TeamInfo } from '@/types/cricket';

import { hawks, kings, lions, riders, strikers, titans, warriors } from './sample-teams';

/** Stands in for a team that the league table has not decided yet. */
const seed = (short: string, name: string): TeamInfo => ({ short, name, tone: 'neutral' });

export const tournamentFixtureGroups: FixtureGroup[] = [
  {
    title: 'Live',
    stage: 'league',
    fixtures: [
      {
        id: 'm12',
        state: 'live',
        label: 'MATCH 12 · LEAGUE',
        sides: [
          { team: kings, score: '168/7', emphasised: false },
          { team: strikers, score: '142/4', emphasised: true },
        ],
        note: 'Strikers need 27 runs from 21 balls',
      },
    ],
  },
  {
    title: 'Upcoming',
    stage: 'league',
    fixtures: [
      {
        id: 'm13',
        state: 'upcoming',
        label: 'MATCH 13 · FRI 24 OCT',
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
        label: 'MATCH 14 · SAT 25 OCT',
        time: '9:30 AM',
        sides: [
          { team: warriors, score: '', emphasised: true },
          { team: lions, score: '', emphasised: true },
        ],
        note: 'Halishahar Ground',
      },
    ],
  },
  {
    title: 'Knockouts',
    stage: 'knockout',
    fixtures: [
      {
        id: 'sf1',
        state: 'upcoming',
        label: 'SEMI-FINAL 1 · SAT 22 NOV',
        time: '3:00 PM',
        sides: [
          { team: seed('1', '1st place'), score: '', emphasised: false },
          { team: seed('4', '4th place'), score: '', emphasised: false },
        ],
        note: 'Teams decided after league stage',
      },
    ],
  },
  {
    title: 'Results',
    stage: 'league',
    fixtures: [
      {
        id: 'm11',
        state: 'result',
        label: 'MATCH 11 · YESTERDAY',
        sides: [
          { team: strikers, score: '176/6', emphasised: true },
          { team: hawks, score: '158/9', emphasised: false },
        ],
        note: 'Strikers won by 18 runs',
      },
    ],
  },
];
