// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import type { OversData } from './types';

export const oversData: OversData = {
  inningsLabel: 'Strikers · 2nd innings',
  runsPerOver: [6, 9, 4, 12, 7, 8, 10, 5, 11, 8, 6, 11, 5, 13, 9, 8, 10],
  wicketOvers: [5, 8, 11, 13],
  overs: [
    { number: 17, bowler: 'Fahim Rahman', to: 'to Imran & Rafi · in progress', runs: 10, score: '142/4', balls: ['1', '4', 'Wd', '4', '', '', ''], inProgress: true },
    { number: 16, bowler: 'Ruhul Amin', to: 'to Rafi & Imran', runs: 8, score: '132/4', balls: ['1', '6', '0', '1', '0', '0'] },
    { number: 15, bowler: 'Tariq Aziz', to: 'to Imran & Rafi', runs: 9, score: '124/4', balls: ['4', '1', '1', '0', '2', '1'] },
    { number: 14, bowler: 'Joy Das', to: 'to Rafi & Imran', runs: 13, score: '115/4', balls: ['0', '1', '4', '1', '1', '6'] },
    { number: 13, bowler: 'Fahim Rahman', to: 'to Rafi, Rony & Imran', runs: 5, score: '102/4', balls: ['1', '0', '1', '2', 'W', '1'] },
    { number: 12, bowler: 'Sabbir Ahmed', to: 'to Rafi & Rony', runs: 11, score: '97/3', balls: ['1', '4', '1', '0', '4', '1'] },
  ],
};
