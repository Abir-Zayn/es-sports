import type { PersistOp } from './event-rows';
import { applyOp, createMatch, reopenMatch, saveResult, startSavedMatch } from './match-repository';
import type { MatchInsert, PlayerRow, ResultUpdate } from './types';

/**
 * One accepted change still on its way to the server. It is plain data, not a callback, so it can be written
 * to the phone before it is sent and sent again after the app is closed. Every kind is safe to repeat.
 * Results and reopens carry their own operation id (`id`); changes saved before it existed get one on load.
 */
export type OutboxOp =
  | { kind: 'create'; match: MatchInsert; players: PlayerRow[]; scorers: string[] }
  | { kind: 'start'; recordShots: boolean; startedAt: string }
  | { kind: 'event'; op: PersistOp }
  | { kind: 'result'; result: ResultUpdate; id?: string }
  | { kind: 'reopen'; id?: string };

/**
 * The id a guarded write is stored under as the match's score head: the event id for an append, the op's own id
 * for an undo, a result or a reopen. Null for writes that do not move the head (create, start, shot direction).
 */
export function opId(op: OutboxOp): string | null {
  if (op.kind === 'event') return op.op.kind === 'insert' ? op.op.row.id : op.op.kind === 'void' ? op.op.id ?? null : null;
  return op.kind === 'result' || op.kind === 'reopen' ? op.id ?? null : null;
}

/** The op with an operation id, made with `newId` when a guarded write from an older app version has none. */
export function withOpId(op: OutboxOp, newId: () => string): OutboxOp {
  if (op.kind === 'event' && op.op.kind === 'void' && !op.op.id) return { ...op, op: { ...op.op, id: newId() } };
  if ((op.kind === 'result' || op.kind === 'reopen') && !op.id) return { ...op, id: newId() };
  return op;
}

const required = (op: OutboxOp): string => {
  const id = opId(op);
  if (!id) throw new Error('A scoring change is missing its operation id.');
  return id;
};

/** `expectedHead` is the last write the phone believes the match accepted; create, start and angle ignore it. */
export function sendOutboxOp(matchId: string, op: OutboxOp, expectedHead: string | null): Promise<void> {
  switch (op.kind) {
    case 'create':
      return createMatch(op.match, op.players, op.scorers);
    case 'start':
      return startSavedMatch(matchId, op.recordShots, op.startedAt);
    case 'event':
      return applyOp(matchId, op.op, op.op.kind === 'void' ? required(op) : null, expectedHead);
    case 'result':
      return saveResult(matchId, op.result, required(op), expectedHead);
    case 'reopen':
      return reopenMatch(matchId, required(op), expectedHead);
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

/** The score head once `op` was accepted on a match whose head was `head`. */
export const applyToHead = (head: string | null, op: OutboxOp): string | null => opId(op) ?? head;

const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Where to carry on sending after the app was closed, from the score head. `head` is the server's head before
 * the first unsent change. If the server still has it, nothing was sent; if the server's head is one of these
 * ops, everything up to it was. Changes after it that do not move the head are safe to repeat. Null means
 * another device wrote since, so sending would overwrite newer work.
 */
export function headResumeIndex(head: string | null, ops: readonly OutboxOp[], server: string | null): number | null {
  if (server === head) return 0;
  for (let at = ops.length - 1; at >= 0; at--) {
    if (opId(ops[at]) !== null && opId(ops[at]) === server) return at + 1;
  }
  return null;
}

/**
 * The same, for changes saved by an app version that did not track the head: `base` is what the server held
 * before the first unsent change, so the server must now look like `base` with some of the changes applied.
 */
export function resumeIndex(base: readonly string[], ops: readonly OutboxOp[], server: readonly string[]): number | null {
  let ids = base;
  for (let index = 0; index <= ops.length; index++) {
    if (same(ids, server)) return index;
    if (index < ops.length) ids = applyToIds(ids, ops[index]);
  }
  return null;
}
