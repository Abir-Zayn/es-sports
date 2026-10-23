// TODO: replace with data from Supabase once the project and tables exist. All sample values from the design file.
import type { TeamInfo, TournamentOverview } from '@/types/cricket';

const strikers: TeamInfo = { short: 'CS', name: 'Chattogram Strikers', tone: 'blue' };
const kings: TeamInfo = { short: 'KK', name: 'Karnaphuli Kings', tone: 'yellow' };
const riders: TeamInfo = { short: 'PR', name: 'Patenga Riders', tone: 'blue' };
const hawks: TeamInfo = { short: 'HH', name: 'Halishahar Hawks', tone: 'yellow' };
const blasters: TeamInfo = { short: 'BB', name: 'Bayazid Blasters', tone: 'yellow' };

export const tournamentSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'table', label: 'Table' },
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
  statusLabel: 'Ongoing',
  progress: 'Match 12 of 31 · Final on 30 Nov',
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
    { id: 'runs', label: 'MOST RUNS', initials: 'RH', name: 'Rafi Hasan', team: 'Chattogram Strikers', value: '312', unit: 'runs' },
    { id: 'wickets', label: 'MOST WICKETS', initials: 'NI', name: 'Nayeem Islam', team: 'Chattogram Strikers', value: '14', unit: 'wickets' },
  ],
  results: [
    {
      id: 'm11',
      label: 'MATCH 11 · YESTERDAY',
      result: 'Strikers won by 18 runs',
      teams: [
        { team: strikers, score: '176/6', won: true },
        { team: hawks, score: '158/9', won: false },
      ],
    },
    {
      id: 'm10',
      label: 'MATCH 10 · 19 OCT',
      result: 'Riders won by 5 wickets',
      teams: [
        { team: blasters, score: '131/8', won: false },
        { team: riders, score: '134/5', won: true },
      ],
    },
  ],
};

/** Every id shows the HSF sample until real tournaments exist. */
export function getTournamentOverview(id: string): TournamentOverview {
  return { ...hsf, id };
}
