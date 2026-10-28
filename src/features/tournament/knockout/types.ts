import type { AvatarTone } from '@/theme';

export type KnockoutRoundId = 'r16' | 'qf' | 'sf' | 'final';

export type KnockoutTeam = {
  id: string;
  short: string;
  name: string;
  score: string;
  won?: boolean;
  tone?: AvatarTone;
  badgeBg?: string;
  badgeText?: string;
};

export type KnockoutMatch = {
  id: string;
  round: KnockoutRoundId;
  home: KnockoutTeam;
  away: KnockoutTeam;
  status: 'FT' | 'Pens' | 'AET' | 'Upcoming';
  winnerId?: string;
};

export type KnockoutBracketDraw = {
  id: string;
  title: string;
  r16: [KnockoutMatch, KnockoutMatch, KnockoutMatch, KnockoutMatch];
  qf: [KnockoutMatch, KnockoutMatch];
  sf: KnockoutMatch;
  finalist: KnockoutTeam;
};

export type KnockoutTournamentData = {
  tournamentId: string;
  name: string;
  season: string;
  drawA: KnockoutBracketDraw;
  drawB: KnockoutBracketDraw;
  finalMatch: KnockoutMatch;
};

