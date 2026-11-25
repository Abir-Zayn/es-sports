import type { MatchSetup, ScorerTeam, TeamCode } from '../types';

// Two full squads for scoring tests. Test data only: the app never shows it.
const squad = (short: string, name: string, tone: 'blue' | 'yellow', xi: [string, string][], bench: string[]): ScorerTeam => ({
  team: { short, name, tone },
  players: [...xi.map(([n, role]) => ({ name: n, role })), ...bench.map((n) => ({ name: n, role: 'Reserve' }))]
    .map((p, i) => ({ ...p, id: `${short}-${i}` })),
});

export const scorerTeams: Record<TeamCode, ScorerTeam> = {
  KK: squad('KK', 'Karnaphuli Kings', 'yellow', [
    ['Sabbir Ahmed', 'Batter · Captain'], ['Rakib Hasan', 'Batter'], ['Shamim Patwary', 'Batter'], ['Fardin Ali', 'Batter · Keeper'],
    ['Joy Das', 'All-rounder'], ['Tariq Aziz', 'All-rounder'], ['Ruhul Amin', 'All-rounder'], ['Fahim Rahman', 'Bowler'],
    ['Akash Dey', 'Bowler'], ['Mithun Sarkar', 'Bowler'], ['Nasir Uddin', 'Bowler'],
  ], ['Rana Mia', 'Kawsar Ali', 'Habib Khan', 'Sumon Roy', 'Zahid Hasan']),
  CS: squad('CS', 'Chattogram Strikers', 'blue', [
    ['Tanvir Hossain', 'Batter'], ['Rafi Hasan', 'Batter · Captain'], ['Sakib Mahmud', 'All-rounder'], ['Arafat Sunny', 'All-rounder'],
    ['Rony Talukdar', 'All-rounder'], ['Imran Kayes', 'All-rounder'], ['Mehrab Hossain', 'Batter · Keeper'], ['Sohan Ali', 'Bowler'],
    ['Liton Roy', 'Bowler'], ['Akib Javed', 'Bowler'], ['Nayeem Islam', 'Bowler'],
  ], ['Jahid Alam', 'Fahad Reza', 'Ripon Das', 'Saif Uddin']),
};

export const initialSetup: MatchSetup = {
  title: 'Match 12 · Kings vs Strikers', teams: scorerTeams, playersPerSide: 11, preset: false,
  tossWinner: 'KK', decision: 'bat', recordShots: true, oversLimit: 20,
  playingXi: { KK: scorerTeams.KK.players.slice(0, 11).map((p) => p.id), CS: scorerTeams.CS.players.slice(0, 11).map((p) => p.id) },
  strikerId: 'KK-0', nonStrikerId: 'KK-1', bowlerId: 'CS-10',
};
