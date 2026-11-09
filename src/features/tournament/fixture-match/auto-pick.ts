import type { ServerSquad } from '../squad/server/squad-server';

/** The first `limit` registered players who are available, in squad order. Fewer when the squad is short. */
export function autoPickXi(squad: ServerSquad, limit: number): string[] {
  return squad.candidates
    .filter((candidate) => squad.selectedIds.includes(candidate.profileId) && candidate.availability === 'available')
    .slice(0, limit)
    .map((candidate) => candidate.profileId);
}
