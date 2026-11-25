// The in-memory tables behind the roster and squad repositories for a tournament not yet on the server.
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

/** Forgets every roster and keeps only `seed`. Tests only. */
export function resetRosters(seed: Roster[] = []) {
  rosters.clear();
  nextId = 1;
  for (const roster of seed) rosters.set(roster.tournamentId, roster);
}
