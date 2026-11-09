import { addMinutes, parseISO } from 'date-fns';

import type { ScheduledMatch } from '../schedule-builder/types';

/** When the match starts on the device's clock (the ground's local date and start minute). */
export const startsAt = (match: Pick<ScheduledMatch, 'date' | 'startMin'>): Date => addMinutes(parseISO(match.date), match.startMin);

const isFinished = (match: ScheduledMatch) => match.match?.status === 'completed';
const isLive = (match: ScheduledMatch) => match.match?.status === 'live';

/**
 * The match the dashboard highlights: a live one first (earliest start), otherwise the earliest match that has
 * not finished and is not cancelled. Null when nothing is left to play.
 */
export function pickNextMatch(matches: ScheduledMatch[]): ScheduledMatch | null {
  const open = matches.filter((match) => !match.cancelled && !isFinished(match));
  const byStart = (a: ScheduledMatch, b: ScheduledMatch) => startsAt(a).getTime() - startsAt(b).getTime() || a.number - b.number;
  const live = open.filter(isLive).sort(byStart);
  return live[0] ?? [...open].sort(byStart)[0] ?? null;
}

/** "Live now", "Starts in 2d 3h", "Starts in 3h 20m", "Starts in 12m", "Starting now" or "Waiting to start". */
export function countdownLabel(match: ScheduledMatch, now: Date): string {
  if (isLive(match)) return 'Live now';
  const minutes = Math.floor((startsAt(match).getTime() - now.getTime()) / 60000);
  if (minutes < -1) return 'Waiting to start';
  if (minutes < 1) return 'Starting now';
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `Starts in ${days}d ${hours}h`;
  if (hours > 0) return `Starts in ${hours}h ${mins}m`;
  return `Starts in ${mins}m`;
}
