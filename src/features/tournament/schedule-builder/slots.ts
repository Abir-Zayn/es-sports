import { addDays, differenceInCalendarDays, format, parseISO } from 'date-fns';

import type { Pairing, ScheduledMatch, SideRef, SlotSettings } from './types';

/**
 * Ground time kept for one match of this many overs: 12 minutes an over (both innings and the change-over), rounded
 * up to half an hour, between 1 and 8 hours. T10 is 2 h, T20 4 h, a one-day game 8 h. The server uses the same rule
 * (`fixture_slot_minutes_for_overs`).
 */
export function slotMinutes(overs: number): number {
  const safe = Number.isFinite(overs) ? overs : 20;
  return Math.min(480, Math.max(60, Math.ceil((safe * 12) / 30) * 30));
}
/** The last match of a day has to finish by 11:00 PM. */
const DAY_END_MIN = 23 * 60;
/** Maximum scheduled matches one team can play on the same day. */
export const MAX_TEAM_MATCHES_PER_DAY = 3;

export const perDayOptions = [1, 2, 3, 4] as const;

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
export function dayFitProblem(settings: SlotSettings, overs: number): string | null {
  const end = settings.firstStartMin + settings.perDay * slotMinutes(overs);
  if (end <= DAY_END_MIN) return null;
  return `${settings.perDay} ${overs}-over matches from ${timeLabel(settings.firstStartMin)} would run past ${timeLabel(DAY_END_MIN)}. Play fewer per day or start earlier.`;
}

const sideKey = (side: SideRef) => (side.kind === 'team' ? side.team.id : side.label);

type Placement = { matches: ScheduledMatch[]; problem: null } | { matches: []; problem: string };

/**
 * Puts the matches on days in order, up to `perDay` a day, starting at `firstStartMin` and one slot apart.
 * A team plays at most 3 times a day, and a day never mixes knockout rounds, so a round's results are in before
 * the next round is played. Fails with the number of days needed when the tournament dates are too few.
 */
export function placeMatches(pairings: Pairing[], days: string[], settings: SlotSettings, overs: number): Placement {
  const fit = dayFitProblem(settings, overs);
  if (fit) return { matches: [], problem: fit };
  const slot = slotMinutes(overs);
  const pending = [...pairings];
  const placed: { pairing: Pairing; dayIndex: number; slotIndex: number }[] = [];

  for (let dayIndex = 0; pending.length > 0; dayIndex++) {
    const round = Math.min(...pending.map((p) => p.round));
    const dayCounts = new Map<string, number>();
    const countOf = (side: SideRef) => dayCounts.get(sideKey(side)) ?? 0;
    let slotIndex = 0;
    for (let i = 0; i < pending.length && slotIndex < settings.perDay; ) {
      const p = pending[i];
      if (p.round === round && countOf(p.home) < MAX_TEAM_MATCHES_PER_DAY && countOf(p.away) < MAX_TEAM_MATCHES_PER_DAY) {
        dayCounts.set(sideKey(p.home), countOf(p.home) + 1);
        dayCounts.set(sideKey(p.away), countOf(p.away) + 1);
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
export function moveProblem(matches: ScheduledMatch[], id: string, date: string, startMin: number, overs: number): string | null {
  const match = matches.find((m) => m.id === id);
  if (!match) return 'This match is no longer in the schedule.';
  const slot = slotMinutes(overs);
  if (startMin < 0 || startMin + slot > DAY_END_MIN) {
    return `A ${overs}-over match starting then would run past ${timeLabel(DAY_END_MIN)}.`;
  }
  const sameDay = matches.filter((m) => m.id !== id && m.date === date);
  if (sameDay.some((m) => Math.abs(m.startMin - startMin) < slot)) return 'Another match is on the ground at that time.';
  for (const key of [sideKey(match.home), sideKey(match.away)]) {
    const count = sameDay.filter((m) => sideKey(m.home) === key || sideKey(m.away) === key).length;
    if (count >= MAX_TEAM_MATCHES_PER_DAY) {
      return `A team in this match already plays ${MAX_TEAM_MATCHES_PER_DAY} matches that day.`;
    }
  }
  return null;
}

/** Matches in the order they are played. */
export const byKickoff = (a: ScheduledMatch, b: ScheduledMatch) => a.date.localeCompare(b.date) || a.startMin - b.startMin;
