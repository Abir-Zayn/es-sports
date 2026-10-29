// The in-memory tables behind the roster and squad repositories, until they live in Supabase.
import { sampleRosters } from './sample-rosters';
import type { Roster } from './types';

const LATENCY_MS = 200;

/** A refused change, with a message fit to show. */
export class RosterError extends Error {}

const rosters = new Map<string, Roster>();
let nextId = 1;

export const wait = () => new Promise<void>((resolve) => setTimeout(resolve, LATENCY_MS));

export function fail(problem: string | null) {
  if (problem) throw new RosterError(problem);
}

export function newId(prefix: string): string {
  return `${prefix}-${nextId++}`;
}

export function find(tournamentId: string): Roster | undefined {
  return rosters.get(tournamentId);
}

export function current(tournamentId: string): Roster {
  const roster = rosters.get(tournamentId);
  if (!roster) throw new RosterError('This tournament could not be found.');
  return roster;
}

export function commit(roster: Roster): Roster {
  rosters.set(roster.tournamentId, roster);
  return roster;
}

export function allRosters(): Roster[] {
  return [...rosters.values()];
}

/** Puts the sample tournaments back and forgets every other roster. Tests only. */
export function resetRosters() {
  rosters.clear();
  nextId = 1;
  for (const roster of sampleRosters()) rosters.set(roster.tournamentId, roster);
}

resetRosters();
