import type { KnockoutBracketDraw, KnockoutMatch, KnockoutTournamentData } from './types';

const drawA: KnockoutBracketDraw = {
  id: 'draw-a',
  title: 'Draw A · Left Bracket',
  r16: [
    {
      id: 'm-r16-1',
      round: 'r16',
      home: { id: 'ars', short: 'ARS', name: 'Arsenal', score: '9', won: true, badgeBg: '#EF4444', badgeText: '#FFF' },
      away: { id: 'psv', short: 'PSV', name: 'PSV Eindhoven', score: '3', won: false, badgeBg: '#DC2626', badgeText: '#FFF' },
      status: 'FT',
      winnerId: 'ars',
    },
    {
      id: 'm-r16-2',
      round: 'r16',
      home: { id: 'atm', short: 'ATM', name: 'Atlético Madrid', score: '2', won: false, badgeBg: '#1D4ED8', badgeText: '#FFF' },
      away: { id: 'rma', short: 'RMA', name: 'Real Madrid', score: '2', won: true, badgeBg: '#F59E0B', badgeText: '#000' },
      status: 'Pens',
      winnerId: 'rma',
    },
    {
      id: 'm-r16-3',
      round: 'r16',
      home: { id: 'lfc', short: 'LFC', name: 'Liverpool', score: '1', won: false, badgeBg: '#B91C1C', badgeText: '#FFF' },
      away: { id: 'psg', short: 'PSG', name: 'Paris Saint-Germain', score: '1', won: true, badgeBg: '#1E3A8A', badgeText: '#EF4444' },
      status: 'Pens',
      winnerId: 'psg',
    },
    {
      id: 'm-r16-4',
      round: 'r16',
      home: { id: 'avl', short: 'AVL', name: 'Aston Villa', score: '6', won: true, badgeBg: '#7C2D12', badgeText: '#38BDF8' },
      away: { id: 'bru', short: 'BRU', name: 'Club Brugge', score: '1', won: false, badgeBg: '#0284C7', badgeText: '#000' },
      status: 'FT',
      winnerId: 'avl',
    },
  ],
  qf: [
    {
      id: 'm-qf-1',
      round: 'qf',
      home: { id: 'rma', short: 'RMA', name: 'Real Madrid', score: '1', won: false, badgeBg: '#F59E0B', badgeText: '#000' },
      away: { id: 'ars', short: 'ARS', name: 'Arsenal', score: '5', won: true, badgeBg: '#EF4444', badgeText: '#FFF' },
      status: 'FT',
      winnerId: 'ars',
    },
    {
      id: 'm-qf-2',
      round: 'qf',
      home: { id: 'avl', short: 'AVL', name: 'Aston Villa', score: '4', won: false, badgeBg: '#7C2D12', badgeText: '#38BDF8' },
      away: { id: 'psg', short: 'PSG', name: 'Paris Saint-Germain', score: '5', won: true, badgeBg: '#1E3A8A', badgeText: '#EF4444' },
      status: 'FT',
      winnerId: 'psg',
    },
  ],
  sf: {
    id: 'm-sf-1',
    round: 'sf',
    home: { id: 'psg', short: 'PSG', name: 'Paris Saint-Germain', score: '3', won: true, badgeBg: '#1E3A8A', badgeText: '#EF4444' },
    away: { id: 'ars', short: 'ARS', name: 'Arsenal', score: '1', won: false, badgeBg: '#EF4444', badgeText: '#FFF' },
    status: 'FT',
    winnerId: 'psg',
  },
  finalist: { id: 'psg', short: 'PSG', name: 'Paris Saint-Germain', score: '2', won: true, badgeBg: '#1E3A8A', badgeText: '#EF4444' },
};

const drawB: KnockoutBracketDraw = {
  id: 'draw-b',
  title: 'Draw B · Right Bracket',
  r16: [
    {
      id: 'm-r16-5',
      round: 'r16',
      home: { id: 'mci', short: 'MCI', name: 'Manchester City', score: '3', won: true, badgeBg: '#38BDF8', badgeText: '#0C4A6E' },
      away: { id: 'juv', short: 'JUV', name: 'Juventus', score: '1', won: false, badgeBg: '#1F2937', badgeText: '#F3F4F6' },
      status: 'FT',
      winnerId: 'mci',
    },
    {
      id: 'm-r16-6',
      round: 'r16',
      home: { id: 'bay', short: 'BAY', name: 'Bayern Munich', score: '4', won: true, badgeBg: '#DC2626', badgeText: '#FFF' },
      away: { id: 'bar', short: 'BAR', name: 'Barcelona', score: '2', won: false, badgeBg: '#991B1B', badgeText: '#FBBF24' },
      status: 'FT',
      winnerId: 'bay',
    },
    {
      id: 'm-r16-7',
      round: 'r16',
      home: { id: 'bvb', short: 'BVB', name: 'Borussia Dortmund', score: '2', won: true, badgeBg: '#FACC15', badgeText: '#000' },
      away: { id: 'spo', short: 'SPO', name: 'Sporting CP', score: '0', won: false, badgeBg: '#059669', badgeText: '#FFF' },
      status: 'FT',
      winnerId: 'bvb',
    },
    {
      id: 'm-r16-8',
      round: 'r16',
      home: { id: 'int', short: 'INT', name: 'Inter Milan', score: '4', won: true, badgeBg: '#1D4ED8', badgeText: '#000' },
      away: { id: 'fey', short: 'FEY', name: 'Feyenoord', score: '1', won: false, badgeBg: '#EF4444', badgeText: '#FFF' },
      status: 'FT',
      winnerId: 'int',
    },
  ],
  qf: [
    {
      id: 'm-qf-3',
      round: 'qf',
      home: { id: 'mci', short: 'MCI', name: 'Manchester City', score: '2', won: false, badgeBg: '#38BDF8', badgeText: '#0C4A6E' },
      away: { id: 'bay', short: 'BAY', name: 'Bayern Munich', score: '3', won: true, badgeBg: '#DC2626', badgeText: '#FFF' },
      status: 'FT',
      winnerId: 'bay',
    },
    {
      id: 'm-qf-4',
      round: 'qf',
      home: { id: 'int', short: 'INT', name: 'Inter Milan', score: '3', won: true, badgeBg: '#1D4ED8', badgeText: '#000' },
      away: { id: 'bvb', short: 'BVB', name: 'Borussia Dortmund', score: '1', won: false, badgeBg: '#FACC15', badgeText: '#000' },
      status: 'FT',
      winnerId: 'int',
    },
  ],
  sf: {
    id: 'm-sf-2',
    round: 'sf',
    home: { id: 'int', short: 'INT', name: 'Inter Milan', score: '2', won: true, badgeBg: '#1D4ED8', badgeText: '#000' },
    away: { id: 'bay', short: 'BAY', name: 'Bayern Munich', score: '1', won: false, badgeBg: '#DC2626', badgeText: '#FFF' },
    status: 'FT',
    winnerId: 'int',
  },
  finalist: { id: 'int', short: 'INT', name: 'Inter Milan', score: '1', won: false, badgeBg: '#1D4ED8', badgeText: '#000' },
};

const finalMatch: KnockoutMatch = {
  id: 'm-final',
  round: 'final',
  home: { id: 'psg', short: 'PSG', name: 'Paris Saint-Germain', score: '2', won: true, badgeBg: '#1E3A8A', badgeText: '#EF4444' },
  away: { id: 'int', short: 'INT', name: 'Inter Milan', score: '1', won: false, badgeBg: '#1D4ED8', badgeText: '#000' },
  status: 'FT',
  winnerId: 'psg',
};

export const sampleKnockoutData: KnockoutTournamentData = {
  tournamentId: 'ucl',
  name: 'UEFA Champions League',
  season: '2024/25',
  drawA,
  drawB,
  finalMatch,
};

export function getKnockoutData(_tournamentId?: string): KnockoutTournamentData {
  return sampleKnockoutData;
}

