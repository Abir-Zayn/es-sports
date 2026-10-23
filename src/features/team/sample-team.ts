// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import { blasters, hawks, kings, lions, riders, strikers, titans } from '@/features/tournament/sample-teams';

import type { SquadPlayer, TeamMatch, TeamMember, TeamProfile } from './types';

const player = (name: string, role: string, tag?: string): SquadPlayer => ({ name, role, tag });

const member = (name: string, kind: TeamMember['kind'], detail: string, tag?: TeamMember['tag']): TeamMember => ({
  name,
  kind,
  detail,
  tag,
});

const match = (
  id: string,
  result: TeamMatch['result'],
  label: string,
  opponent: TeamMatch['opponent'],
  scores: string,
  outcome: string,
): TeamMatch => ({ id, result, label, opponent, scores, outcome });

const strikersProfile: TeamProfile = {
  team: strikers,
  standing: 'HSF Premier League · 1st',
  captain: 'Rafi Hasan',
  location: 'Halishahar, Chattogram',
  record: { played: 5, won: 4, lost: 1, position: 1 },
  live: {
    id: 'm12',
    label: 'MATCH 12 · HSF PREMIER LEAGUE',
    versus: 'vs Karnaphuli Kings',
    score: '142/4',
    overs: '(16.3)',
    status: 'Need 27 runs from 21 balls',
  },
  form: [
    { id: 'f1', won: true, versus: 'vs AT', match: 'M1' },
    { id: 'f2', won: true, versus: 'vs KL', match: 'M4' },
    { id: 'f3', won: false, versus: 'vs PR', match: 'M7' },
    { id: 'f4', won: true, versus: 'vs BB', match: 'M9' },
    { id: 'f5', won: true, versus: 'vs HH', match: 'M11' },
  ],
  keyPlayers: [
    { name: 'Rafi Hasan', label: 'Captain · Top run scorer', value: '312', unit: 'runs' },
    { name: 'Nayeem Islam', label: 'Top wicket taker', value: '14', unit: 'wickets' },
    { name: 'Imran Kayes', label: 'All-rounder', value: '148', unit: 'runs · 6 wkts' },
  ],
  info: [
    { label: 'Captain', value: 'Rafi Hasan' },
    { label: 'Manager', value: 'Kamal Uddin' },
    { label: 'Home ground', value: 'Halishahar Ground' },
    { label: 'Squad', value: '15 players' },
    { label: 'Tournaments', value: 'HSF Premier League 2026' },
  ],
  squad: {
    forMatch: 'Match 12 vs Karnaphuli Kings',
    playingXi: [
      player('Tanvir Hossain', 'Batter'),
      player('Rafi Hasan', 'Batter', 'C'),
      player('Sakib Mahmud', 'All-rounder'),
      player('Arafat Sunny', 'All-rounder'),
      player('Rony Talukdar', 'All-rounder'),
      player('Imran Kayes', 'All-rounder'),
      player('Mehrab Hossain', 'Keeper', 'WK'),
      player('Sohan Ali', 'Bowler'),
      player('Liton Roy', 'Bowler'),
      player('Akib Javed', 'Bowler'),
      player('Nayeem Islam', 'Bowler'),
    ],
    bench: [
      player('Jahid Alam', 'Batter'),
      player('Fahad Reza', 'Bowler'),
      player('Ripon Das', 'All-rounder'),
      player('Saif Uddin', 'Bowler'),
    ],
  },
  members: [
    member('Rafi Hasan', 'bat', 'Batter · Right-hand bat', 'Captain'),
    member('Tanvir Hossain', 'bat', 'Batter · Left-hand bat'),
    member('Mehrab Hossain', 'bat', 'Wicket-keeper batter', 'Keeper'),
    member('Jahid Alam', 'bat', 'Batter · Right-hand bat'),
    member('Sakib Mahmud', 'ar', 'All-rounder · Right-hand bat'),
    member('Arafat Sunny', 'ar', 'All-rounder · Left-arm spin'),
    member('Rony Talukdar', 'ar', 'All-rounder · Right-arm medium'),
    member('Imran Kayes', 'ar', 'All-rounder · Off spin'),
    member('Ripon Das', 'ar', 'All-rounder · Right-hand bat', 'Invited'),
    member('Nayeem Islam', 'bowl', 'Bowler · Right-arm fast'),
    member('Sohan Ali', 'bowl', 'Bowler · Left-arm fast'),
    member('Liton Roy', 'bowl', 'Bowler · Leg spin'),
    member('Akib Javed', 'bowl', 'Bowler · Right-arm medium'),
    member('Fahad Reza', 'bowl', 'Bowler · Off spin'),
    member('Saif Uddin', 'bowl', 'Bowler · Right-arm fast'),
    member('Kamal Uddin', 'staff', 'Team manager', 'Manager'),
    member('Habibur Rahman', 'staff', 'Coach', 'Staff'),
  ],
  matches: [
    match('m12', 'live', 'MATCH 12 · TODAY', kings, 'CS 142/4 (16.3) · KK 168/7', 'Need 27 runs from 21 balls'),
    match('m11', 'W', 'MATCH 11 · YESTERDAY', hawks, 'CS 176/6 · HH 158/9', 'Won by 18 runs'),
    match('m9', 'W', 'MATCH 9 · 16 OCT', blasters, 'BB 125/8 · CS 128/3', 'Won by 7 wickets'),
    match('m7', 'L', 'MATCH 7 · 13 OCT', riders, 'PR 163/6 · CS 151/8', 'Lost by 12 runs'),
    match('m4', 'W', 'MATCH 4 · 9 OCT', lions, 'CS 182/5 · KL 137/9', 'Won by 45 runs'),
    match('m1', 'W', 'MATCH 1 · 5 OCT', titans, 'AT 145/7 · CS 149/6', 'Won by 4 wickets'),
  ],
};

/** Every id shows the Strikers sample until real teams exist. */
export function getTeamProfile(_id: string): TeamProfile {
  return strikersProfile;
}
