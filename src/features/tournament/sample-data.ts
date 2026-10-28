// TODO: replace with data from Supabase once the project and tables exist. All sample values from the design file.
import type { TournamentOverview } from '@/types/cricket';

import { tournamentFixtures } from './sample-matches';
import { hawks, kings, riders, strikers } from './sample-teams';

export const tournamentSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'table', label: 'Table' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'stats', label: 'Stats' },
  { id: 'teams', label: 'Teams' },
] as const;

export type TournamentSectionId = (typeof tournamentSections)[number]['id'];

const hsf: TournamentOverview = {
  id: 't1',
  short: 'HSF',
  name: 'HSF Premier League 2026',
  tone: 'blue',
  meta: 'League + Knockout · T20 · 8 teams · Halishahar Ground',
  format: 'League + Knockout · T20',
  statusLabel: 'Ongoing',
  progress: 'Match 12 of 31 · Final on 30 Nov',
  matchesPlayed: 11,
  matchesTotal: 31,
  teamCount: 8,
  finalDate: '30 Nov',
  live: {
    label: 'MATCH 12 · LEAGUE',
    match: {
      id: 'm12',
      label: 'MATCH 12 · LEAGUE',
      status: 'Need 27 runs from 21 balls',
      teams: [
        { ...kings, score: '168/7', overs: '(20)', batting: false },
        { ...strikers, score: '142/4', overs: '(16.3)', batting: true },
      ],
      balls: [],
    },
  },
  standings: [
    { pos: 1, team: strikers, played: 5, points: 8, nrr: '+1.245' },
    { pos: 2, team: kings, played: 5, points: 8, nrr: '+0.870' },
    { pos: 3, team: riders, played: 5, points: 6, nrr: '+0.412' },
    { pos: 4, team: hawks, played: 5, points: 6, nrr: '-0.105' },
  ],
  performers: [
    { id: 'runs', label: 'Highest runs', initials: 'RH', name: 'Rafi Hasan', team: 'Chattogram Strikers', value: '312', unit: 'runs' },
    { id: 'wickets', label: 'Highest wickets', initials: 'NI', name: 'Nayeem Islam', team: 'Chattogram Strikers', value: '14', unit: 'wickets' },
    {
      id: 'team-total',
      label: 'Highest team total',
      initials: strikers.short,
      tone: strikers.tone,
      name: strikers.name,
      team: strikers.name,
      value: '176/6',
      unit: '20 overs',
    },
  ],
  // The same finished matches the Matches section lists, newest first.
  results: tournamentFixtures.filter((fixture) => fixture.state === 'result'),
};

/** Tournament overview data. Shows UEFA Champions League or sample tournament. */
export function getTournamentOverview(id: string): TournamentOverview {
  if (id === 'ucl') {
    return {
      ...hsf,
      id: 'ucl',
      short: 'UCL',
      name: 'UEFA Champions League',
      tone: 'blue',
      meta: 'Knockout Stage · 2024/25 Season · 16 Teams',
      format: '2024/25',
    };
  }
  return { ...hsf, id };
}
