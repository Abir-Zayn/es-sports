// TODO: replace with data from Supabase once the project and tables exist. All sample values from the design file.
export type TeamInfo = { short: string; name: string; color: string };
export type LiveTeam = TeamInfo & { score: string; overs: string; batting: boolean };
export type LiveMatch = {
  id: string;
  label: string;
  status: string;
  teams: [LiveTeam, LiveTeam];
  balls: string[];
};
export type Fixture = { id: string; month: string; day: string; weekday: string; home: string; away: string; meta: string };
export type Tournament = { id: string; short: string; name: string; meta: string };

const YELLOW = '#FFC83D';
const BLUE = '#3DA9FF';

export const sampleUser = { initials: 'TR', name: 'Tanvir', unreadNotifications: 3 };

export const liveMatches: LiveMatch[] = [
  {
    id: 'm12',
    label: 'HSF PREMIER LEAGUE · MATCH 12',
    status: 'Strikers need 27 runs from 21 balls',
    teams: [
      { short: 'KK', name: 'Karnaphuli Kings', color: YELLOW, score: '168/7', overs: '(20)', batting: false },
      { short: 'CS', name: 'Chattogram Strikers', color: BLUE, score: '142/4', overs: '(16.3)', batting: true },
    ],
    balls: ['1', '4', 'Wd', '4'],
  },
  {
    id: 'friendly',
    label: 'FRIENDLY MATCH',
    status: 'Riders opted to bat',
    teams: [
      { short: 'PR', name: 'Patenga Riders', color: BLUE, score: '64/2', overs: '(8.1)', batting: true },
      { short: 'AT', name: 'Agrabad Titans', color: YELLOW, score: 'Yet to bat', overs: '', batting: false },
    ],
    balls: ['0', '1', '2', '1'],
  },
];

export const myTeams: TeamInfo[] = [
  { short: 'CS', name: 'Chattogram Strikers', color: BLUE },
  { short: 'HH', name: 'Halishahar Hawks', color: YELLOW },
  { short: 'PW', name: 'Port City Warriors', color: BLUE },
];

export const upcoming: Fixture[] = [
  { id: 'f1', month: 'OCT', day: '24', weekday: 'FRI', home: 'Patenga Riders', away: 'vs Agrabad Titans', meta: '4:00 PM · Halishahar Ground' },
  { id: 'f2', month: 'OCT', day: '26', weekday: 'SUN', home: 'Chattogram Strikers', away: 'vs Port City Warriors', meta: '3:00 PM · Halishahar Ground' },
  { id: 'f3', month: 'OCT', day: '27', weekday: 'MON', home: 'Karnaphuli Kings', away: 'vs Halishahar Hawks', meta: '3:00 PM · Patenga Field' },
];

export const tournaments: Tournament[] = [
  { id: 't1', short: 'HSF', name: 'HSF Premier League', meta: '8 teams · League + Knockout' },
  { id: 't2', short: 'CTG', name: 'Port City T10 Cup', meta: '6 teams · Starts 2 Nov' },
];
