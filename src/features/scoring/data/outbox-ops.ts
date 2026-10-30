import type { PersistOp } from './event-rows';
import { applyOp, createMatch, reopenMatch, saveResult, startSavedMatch } from './match-repository';
import type { MatchInsert, PlayerRow, ResultUpdate } from './types';

/**
 * One accepted change still on its way to the server. It is plain data, not a callback, so it can be written
 * to the phone before it is sent and sent again after the app is closed. Every kind is safe to repeat.
 */
export type OutboxOp =
  | { kind: 'create'; match: MatchInsert; players: PlayerRow[]; scorers: string[] }
  | { kind: 'start'; recordShots: boolean; startedAt: string }
  | { kind: 'event'; op: PersistOp }
  | { kind: 'result'; result: ResultUpdate }
  | { kind: 'reopen' };

export function sendOutboxOp(matchId: string, op: OutboxOp): Promise<void> {
  switch (op.kind) {
    case 'create':
      return createMatch(op.match, op.players, op.scorers);
    case 'start':
      return startSavedMatch(matchId, op.recordShots, op.startedAt);
    case 'event':
      return applyOp(matchId, op.op);
    case 'result':
      return saveResult(matchId, op.result);
    case 'reopen':
      return reopenMatch(matchId);
  }
}

/** The live event ids, in order, once `op` has been applied to a match that held `ids`. */
export function applyToIds(ids: readonly string[], op: OutboxOp): readonly string[] {
  if (op.kind !== 'event') return ids;
  if (op.op.kind === 'insert') return ids.includes(op.op.row.id) ? ids : [...ids, op.op.row.id];
  if (op.op.kind === 'void') {
    // The server voids the event and everything after it, which is what cutting the list here does.
    const at = ids.indexOf(op.op.fromId);
    return at < 0 ? ids : ids.slice(0, at);
  }
  return ids;
}

const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Where to carry on sending after the app was closed. `base` is what the server held before the first unsent
 * change, so the server must now look like `base` with some of the changes applied. The earliest match is
 * chosen: changes between it and the true position leave the live events as they are and are safe to repeat.
 * Null means the server holds events this phone never wrote, so sending would overwrite newer work.
 */
export function resumeIndex(base: readonly string[], ops: readonly OutboxOp[], server: readonly string[]): number | null {
  let ids = base;
  for (let index = 0; index <= ops.length; index++) {
    if (same(ids, server)) return index;
    if (index < ops.length) ids = applyToIds(ids, ops[index]);
  }
  return null;
}
