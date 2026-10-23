// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import { kings, strikers } from '@/features/tournament/sample-teams';

import type { BatterLine, BowlerLine, Innings, LiveSnapshot, MatchHeader, Partnership } from './types';

export const matchHeader: MatchHeader = {
  id: 'm12',
  label: 'MATCH 12 · HSF PREMIER LEAGUE',
  title: 'Kings vs Strikers',
  subtitle: 'Match 12 · HSF Premier League',
};

const out = (name: string, how: string, runs: number, balls: number, fours: number, sixes: number): BatterLine => ({
  name,
  how,
  notOut: false,
  runs,
  balls,
  fours,
  sixes,
});

const notOut = (name: string, runs: number, balls: number, fours: number, sixes: number): BatterLine => ({
  name,
  how: 'not out',
  notOut: true,
  runs,
  balls,
  fours,
  sixes,
});

const bowler = (name: string, overs: string, maidens: number, runs: number, wickets: number): BowlerLine => ({
  name,
  overs,
  maidens,
  runs,
  wickets,
});

const pair = (wicket: string, names: string, runs: number, live = false): Partnership => ({ wicket, pair: names, runs, live });

export const liveSnapshot: LiveSnapshot = {
  sides: [
    { team: kings, score: '168/7', overs: '20 ov', batting: false },
    { team: strikers, score: '142/4', overs: '16.3 ov · batting', batting: true },
  ],
  target: 'Strikers need 27 runs from 21 balls',
  currentRunRate: '8.61',
  requiredRunRate: '7.71',
  streamLabel: 'Watch live stream',
  streamSource: 'YouTube · HSF Sports Channel',
  partnership: '41 runs · 26 balls',
  batters: [
    { name: 'Rafi Hasan', onStrike: true, runs: 68, balls: 41, fours: 6, sixes: 3 },
    { name: 'Imran Kayes', onStrike: false, runs: 22, balls: 15, fours: 2, sixes: 1 },
  ],
  bowler: bowler('Fahim Rahman', '3.3', 0, 28, 2),
};

/** Both innings, first innings first. */
export const innings: Innings[] = [
  {
    id: 'kk',
    team: kings,
    score: '168/7',
    summary: '20 ov · 1st innings',
    batters: [
      out('Sabbir Ahmed', 'c Rafi b Nayeem', 54, 38, 5, 2),
      out('Rakib Hasan', 'b Nayeem', 31, 24, 3, 1),
      out('Shamim Patwary', 'c Tanvir b Rony', 27, 19, 2, 1),
      out('Fardin Ali', 'run out (Imran)', 18, 12, 1, 1),
      out('Joy Das', 'c Sakib b Arafat', 12, 9, 1, 0),
      out('Tariq Aziz', 'c Mehrab b Nayeem', 8, 6, 1, 0),
      out('Ruhul Amin', 'b Imran', 6, 5, 0, 0),
      notOut('Fahim Rahman', 4, 4, 0, 0),
      notOut('Akash Dey', 1, 3, 0, 0),
    ],
    extras: 7,
    extrasDetail: '(wd 4, nb 1, lb 2)',
    total: '168/7',
    totalOvers: '(20 ov)',
    yetToBat: [],
    fallOfWickets: [
      { score: '1-45', over: '5.3', name: 'Rakib' },
      { score: '2-92', over: '11.2', name: 'Sabbir' },
      { score: '3-118', over: '14.1', name: 'Shamim' },
      { score: '4-136', over: '16.2', name: 'Fardin' },
      { score: '5-150', over: '17.4', name: 'Joy' },
      { score: '6-159', over: '18.5', name: 'Tariq' },
      { score: '7-163', over: '19.3', name: 'Ruhul' },
    ],
    bowlers: [
      bowler('Nayeem Islam', '4', 0, 26, 3),
      bowler('Rony Talukdar', '4', 0, 35, 1),
      bowler('Imran Kayes', '4', 0, 38, 1),
      bowler('Arafat Sunny', '4', 0, 33, 1),
      bowler('Sakib Mahmud', '4', 0, 34, 0),
    ],
    partnerships: [
      pair('1st', 'Sabbir & Rakib', 45),
      pair('2nd', 'Sabbir & Shamim', 47),
      pair('3rd', 'Shamim & Fardin', 26),
      pair('4th', 'Fardin & Joy', 18),
      pair('5th', 'Joy & Tariq', 14),
      pair('6th', 'Tariq & Ruhul', 9),
      pair('7th', 'Ruhul & Fahim', 4),
      pair('8th', 'Fahim & Akash', 5),
    ],
  },
  {
    id: 'cs',
    team: strikers,
    score: '142/4',
    summary: '16.3 ov · batting',
    batters: [
      out('Tanvir Hossain', 'c Joy b Fahim', 18, 14, 3, 0),
      notOut('Rafi Hasan', 68, 41, 6, 3),
      out('Sakib Mahmud', 'lbw b Tariq', 12, 12, 1, 0),
      out('Arafat Sunny', 'c & b Ruhul', 9, 10, 1, 0),
      out('Rony Talukdar', 'b Fahim', 4, 7, 0, 0),
      notOut('Imran Kayes', 22, 15, 2, 1),
    ],
    extras: 9,
    extrasDetail: '(wd 5, nb 1, lb 3)',
    total: '142/4',
    totalOvers: '(16.3 ov)',
    yetToBat: ['Mehrab Hossain', 'Sohan Ali', 'Liton Roy', 'Akib Javed', 'Nayeem Islam'],
    fallOfWickets: [
      { score: '1-31', over: '4.2', name: 'Tanvir' },
      { score: '2-58', over: '7.5', name: 'Sakib' },
      { score: '3-80', over: '10.4', name: 'Arafat' },
      { score: '4-101', over: '12.5', name: 'Rony' },
    ],
    bowlers: [
      bowler('Fahim Rahman', '3.3', 0, 28, 2),
      bowler('Tariq Aziz', '4', 0, 31, 1),
      bowler('Joy Das', '4', 0, 36, 0),
      bowler('Ruhul Amin', '3', 0, 24, 1),
      bowler('Sabbir Ahmed', '2', 0, 20, 0),
    ],
    partnerships: [
      pair('1st', 'Tanvir & Rafi', 31),
      pair('2nd', 'Rafi & Sakib', 27),
      pair('3rd', 'Rafi & Arafat', 22),
      pair('4th', 'Rafi & Rony', 21),
      pair('5th', 'Rafi & Imran', 41, true),
    ],
  },
];
