// Where a tournament's schedule is kept: on the server for a published (uuid) tournament, in memory for the sample
// and the draft being set up. Both give the same shapes, so the builder does not care which one runs.
import { isUuid } from '@/features/scoring/data/uuid';

import { cancelFixture, fetchServerSchedule, publishServerSchedule, rescheduleFixture } from './schedule-server';
import type { Schedule, ScheduledMatch, ScheduleMode, SlotSettings } from './types';

const LATENCY_MS = 200;

/** A refused save, with a message fit to show. */
export class ScheduleError extends Error {}

const schedules = new Map<string, Schedule>();
const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

/** The saved schedule, or null before one is published. */
export async function fetchSchedule(tournamentId: string): Promise<Schedule | null> {
  if (isUuid(tournamentId)) return fetchServerSchedule(tournamentId);
  await wait();
  return schedules.get(tournamentId) ?? null;
}

/** Publishes the schedule so teams and followers can see it. Only the tournament owner may. */
export async function publishSchedule(
  tournamentId: string,
  isOwner: boolean,
  mode: ScheduleMode,
  settings: SlotSettings,
  matches: ScheduledMatch[],
): Promise<Schedule> {
  if (!isOwner) throw new ScheduleError('Only the tournament owner can publish the schedule.');
  if (matches.length === 0) throw new ScheduleError('Draw or add the matches before publishing.');
  if (isUuid(tournamentId)) return publishServerSchedule(tournamentId, mode, settings, matches);
  await wait();
  const schedule = { tournamentId, mode, settings, matches, publishedAt: new Date().toISOString() };
  schedules.set(tournamentId, schedule);
  return schedule;
}

/** The in-memory schedule after `change`, as if the server had applied it. */
function changeLocal(tournamentId: string, id: string, change: (m: ScheduledMatch) => ScheduledMatch): Schedule {
  const saved = schedules.get(tournamentId);
  if (!saved) throw new ScheduleError('Publish the schedule first.');
  const next = { ...saved, matches: saved.matches.map((m) => (m.id === id ? change(m) : m)) };
  schedules.set(tournamentId, next);
  return next;
}

/** Moves one published match and returns the schedule after it. The teams playing are told. */
export async function movePublishedMatch(tournamentId: string, id: string, date: string, startMin: number): Promise<Schedule | null> {
  if (isUuid(tournamentId)) {
    await rescheduleFixture(id, date, startMin);
    return fetchServerSchedule(tournamentId);
  }
  await wait();
  return changeLocal(tournamentId, id, (m) => ({ ...m, date, startMin }));
}

/** Cancels one published match with a reason, and returns the schedule after it. */
export async function cancelPublishedMatch(tournamentId: string, id: string, reason: string): Promise<Schedule | null> {
  if (isUuid(tournamentId)) {
    await cancelFixture(id, reason);
    return fetchServerSchedule(tournamentId);
  }
  await wait();
  return changeLocal(tournamentId, id, (m) => ({ ...m, cancelled: { reason: reason.trim() } }));
}

/** Clears every in-memory schedule. Tests only. */
export function resetSchedules() {
  schedules.clear();
}
