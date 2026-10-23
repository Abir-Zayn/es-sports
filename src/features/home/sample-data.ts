// TODO: replace with data from Supabase once the project and tables exist. All sample values from the design file.
import type { AvatarTone } from '@/theme';
import type { LiveMatch, TeamInfo, UpcomingMatch } from '@/types/cricket';

export type HomeUser = { initials: string; name: string; tone: AvatarTone; avatarUri?: string; unreadNotifications: number };
export type Tournament = { id: string; short: string; name: string; meta: string; tone: AvatarTone; avatarUri?: string };

export const sampleUser: HomeUser = { initials: 'TR', name: 'Tanvir', tone: 'blue', unreadNotifications: 3 };

export const liveMatches: LiveMatch[] = [
  {
    id: 'm12',
    label: 'HSF PREMIER LEAGUE · MATCH 12',
    status: 'Strikers need 27 runs from 21 balls',
    teams: [
      { short: 'KK', name: 'Karnaphuli Kings', tone: 'yellow', score: '168/7', overs: '(20)', batting: false },
      { short: 'CS', name: 'Chattogram Strikers', tone: 'blue', score: '142/4', overs: '(16.3)', batting: true },
    ],
    balls: ['1', '4', 'Wd', '4'],
  },
  {
    id: 'friendly',
    label: 'FRIENDLY MATCH',
    status: 'Riders opted to bat',
    teams: [
      { short: 'PR', name: 'Patenga Riders', tone: 'blue', score: '64/2', overs: '(8.1)', batting: true },
      { short: 'AT', name: 'Agrabad Titans', tone: 'yellow', score: 'Yet to bat', overs: '', batting: false },
    ],
    balls: ['0', '1', '2', '1'],
  },
];

export const myTeams: TeamInfo[] = [
  { short: 'CS', name: 'Chattogram Strikers', tone: 'blue' },
  { short: 'HH', name: 'Halishahar Hawks', tone: 'yellow' },
  { short: 'PW', name: 'Port City Warriors', tone: 'blue' },
];

export const upcoming: UpcomingMatch[] = [
  { id: 'f1', month: 'OCT', day: '24', weekday: 'FRI', home: 'Patenga Riders', away: 'vs Agrabad Titans', meta: '4:00 PM · Halishahar Ground' },
  { id: 'f2', month: 'OCT', day: '26', weekday: 'SUN', home: 'Chattogram Strikers', away: 'vs Port City Warriors', meta: '3:00 PM · Halishahar Ground' },
  { id: 'f3', month: 'OCT', day: '27', weekday: 'MON', home: 'Karnaphuli Kings', away: 'vs Halishahar Hawks', meta: '3:00 PM · Patenga Field' },
];

export const tournaments: Tournament[] = [
  { id: 't1', short: 'HSF', name: 'HSF Premier League', meta: '8 teams · League + Knockout', tone: 'blue' },
  { id: 't2', short: 'CTG', name: 'Port City T10 Cup', meta: '6 teams · Starts 2 Nov', tone: 'yellow' },
];
