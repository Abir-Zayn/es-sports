import type { KnockoutMatch, KnockoutRoundId, KnockoutTeam } from './types';

export const roundNames: Record<KnockoutRoundId, string> = { r16: 'Round of 16', qf: 'Quarter final', sf: 'Semi final', final: 'Final' };

const statusNames: Record<KnockoutMatch['status'], string> = { FT: 'full time', Pens: 'won on penalties', AET: 'after extra time', Upcoming: 'not played yet' };

/** Short status shown on a card; "Upcoming" is too wide for the compact card. */
export const statusShort = (status: KnockoutMatch['status']) => (status === 'Upcoming' ? 'TBD' : status);

export const winnerOf = (match: KnockoutMatch): KnockoutTeam | null =>
  match.home.won ? match.home : match.away.won ? match.away : null;

/** Everything a screen reader needs from one bracket card, e.g. "Round of 16: Arsenal 9, PSV Eindhoven 3, full time. Arsenal won". */
export function matchLabel(match: KnockoutMatch): string {
  const round = roundNames[match.round] ?? '';
  if (match.status === 'Upcoming') return `${round}: ${match.home.name} versus ${match.away.name}, not played yet`;
  const winner = winnerOf(match);
  const base = `${round}: ${match.home.name} ${match.home.score}, ${match.away.name} ${match.away.score}, ${statusNames[match.status] ?? match.status}`;
  return winner ? `${base}. ${winner.name} won` : base;
}
