import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

import type { MatchFormat, Pairing, ScheduledMatch, SideRef, SlotSettings } from './types';

/** Time kept for one match, play plus the change-over. */
export const slotMinutes: Record<MatchFormat, number> = { T10: 120, T20: 240, ODI: 480 };
/** The last match of a day has to finish by 11:00 PM. */
const DAY_END_MIN = 23 * 60;

export const perDayOptions = [1, 2, 3, 4] as const;
export const firstStartOptions = [8 * 60, 9 * 60, 10 * 60, 13 * 60, 14 * 60, 15 * 60] as const;

/** 540 becomes "9:00 AM". */
export function timeLabel(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** Every day from `start` to `end`, both included, as "YYYY-MM-DD". Empty if the range is backwards. */
export function tournamentDays(start: string, end: string): string[] {
  const from = parseISO(start);
  const count = differenceInCalendarDays(parseISO(end), from) + 1;
  if (!Number.isFinite(count) || count < 1) return [];
  return Array.from({ length: count }, (_, i) => format(addDays(from, i), 'yyyy-MM-dd'));
}

/** Why a day cannot hold this many matches of this format, or null when it fits. */
export function dayFitProblem(settings: SlotSettings, matchFormat: MatchFormat): string | null {
  const end = settings.firstStartMin + settings.perDay * slotMinutes[matchFormat];
  if (end <= DAY_END_MIN) return null;
  return `${settings.perDay} ${matchFormat} matches from ${timeLabel(settings.firstStartMin)} would run past ${timeLabel(DAY_END_MIN)}. Play fewer per day or start earlier.`;
}

const sideKey = (side: SideRef) => (side.kind === 'team' ? side.team.id : side.label);

type Placement = { matches: ScheduledMatch[]; problem: null } | { matches: []; problem: string };

/**
 * Puts the matches on days in order, up to `perDay` a day, starting at `firstStartMin` and one slot apart.
 * A team plays at most once a day, and a day never mixes knockout rounds, so a round's results are in before
 * the next round is played. Fails with the number of days needed when the tournament dates are too few.
 */
export function placeMatches(pairings: Pairing[], days: string[], settings: SlotSettings, matchFormat: MatchFormat): Placement {
  const fit = dayFitProblem(settings, matchFormat);
  if (fit) return { matches: [], problem: fit };
  const slot = slotMinutes[matchFormat];
  const pending = [...pairings];
  const placed: { pairing: Pairing; dayIndex: number; slotIndex: number }[] = [];

  for (let dayIndex = 0; pending.length > 0; dayIndex++) {
    const round = Math.min(...pending.map((p) => p.round));
    const busy = new Set<string>();
    let slotIndex = 0;
    for (let i = 0; i < pending.length && slotIndex < settings.perDay; ) {
      const p = pending[i];
      if (p.round === round && !busy.has(sideKey(p.home)) && !busy.has(sideKey(p.away))) {
        busy.add(sideKey(p.home));
        busy.add(sideKey(p.away));
        placed.push({ pairing: p, dayIndex, slotIndex: slotIndex++ });
        pending.splice(i, 1);
      } else i++;
    }
  }

  const daysNeeded = placed.reduce((max, p) => Math.max(max, p.dayIndex + 1), 0);
  if (daysNeeded > days.length) {
    return {
      matches: [],
      problem: `This needs ${daysNeeded} days, but the tournament runs ${days.length}. Play more matches a day or move the end date.`,
    };
  }
  return {
    matches: placed.map(({ pairing, dayIndex, slotIndex }) => ({
      ...pairing,
      id: `m${pairing.number}`,
      date: days[dayIndex],
      startMin: settings.firstStartMin + slotIndex * slot,
    })),
    problem: null,
  };
}

/** Why one match cannot move to this date and time, or null when it can. */
export function moveProblem(matches: ScheduledMatch[], id: string, date: string, startMin: number, matchFormat: MatchFormat): string | null {
  const match = matches.find((m) => m.id === id);
  if (!match) return 'This match is no longer in the schedule.';
  const slot = slotMinutes[matchFormat];
  if (startMin + slot > DAY_END_MIN) return `A ${matchFormat} match starting then would run past ${timeLabel(DAY_END_MIN)}.`;
  const sameDay = matches.filter((m) => m.id !== id && m.date === date);
  if (sameDay.some((m) => Math.abs(m.startMin - startMin) < slot)) return 'Another match is on the ground at that time.';
  const sides = new Set([sideKey(match.home), sideKey(match.away)]);
  const clash = sameDay.find((m) => sides.has(sideKey(m.home)) || sides.has(sideKey(m.away)));
  if (clash) return `A team in this match already plays Match ${clash.number} that day.`;
  return null;
}

/** Matches in the order they are played. */
export const byKickoff = (a: ScheduledMatch, b: ScheduledMatch) => a.date.localeCompare(b.date) || a.startMin - b.startMin;
