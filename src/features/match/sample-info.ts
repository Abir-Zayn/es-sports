// TODO: replace with data from Supabase once the project and tables exist. Sample values from the design file.
import { kings, strikers } from '@/features/tournament/sample-teams';

import type { MatchInfoData, SquadPlayer } from './types';

const p = (name: string, role: string): SquadPlayer => ({ name, role });

export const matchInfo: MatchInfoData = {
  tossNote: { team: 'Karnaphuli Kings', decision: 'won the toss and chose to bat' },
  details: [
    { label: 'Tournament', value: 'HSF Premier League 2026' },
    { label: 'Match', value: 'Match 12 · League stage' },
    { label: 'Format', value: 'T20 · 20 overs per side' },
    { label: 'Date & time', value: 'Wed 21 Oct 2026 · 3:00 PM' },
    { label: 'Venue', value: 'Halishahar Ground, Chattogram' },
    { label: 'Umpires', value: 'Kamrul Islam, Shahid Ullah' },
    { label: 'Scorer', value: 'Arif Chowdhury' },
  ],
  streams: [
    { id: 'youtube', label: 'YouTube', tone: 'red' },
    { id: 'facebook', label: 'Facebook', tone: 'blue' },
  ],
  squads: [
    {
      team: kings,
      playingXi: [
        p('Sabbir Ahmed', 'Batter · Captain'),
        p('Rakib Hasan', 'Batter'),
        p('Shamim Patwary', 'Batter'),
        p('Fardin Ali', 'Batter · Keeper'),
        p('Joy Das', 'All-rounder'),
        p('Tariq Aziz', 'All-rounder'),
        p('Ruhul Amin', 'All-rounder'),
        p('Fahim Rahman', 'Bowler'),
        p('Akash Dey', 'Bowler'),
        p('Mithun Sarkar', 'Bowler'),
        p('Nasir Uddin', 'Bowler'),
      ],
      bench: ['Rana Mia', 'Kawsar Ali', 'Habib Khan', 'Sumon Roy', 'Zahid Hasan'],
    },
    {
      team: strikers,
      playingXi: [
        p('Tanvir Hossain', 'Batter'),
        p('Rafi Hasan', 'Batter · Captain'),
        p('Sakib Mahmud', 'All-rounder'),
        p('Arafat Sunny', 'All-rounder'),
        p('Rony Talukdar', 'All-rounder'),
        p('Imran Kayes', 'All-rounder'),
        p('Mehrab Hossain', 'Batter · Keeper'),
        p('Sohan Ali', 'Bowler'),
        p('Liton Roy', 'Bowler'),
        p('Akib Javed', 'Bowler'),
        p('Nayeem Islam', 'Bowler'),
      ],
      bench: ['Jahid Alam', 'Fahad Reza', 'Ripon Das', 'Saif Uddin'],
    },
  ],
};
