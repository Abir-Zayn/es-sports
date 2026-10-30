import type { AuditEvent } from '../session-reducer';
import type { DeliveryInput } from '../types';
import type { BallEventInsert, BallEventRow } from './types';

/** One write the match store has to make after the scorer accepted a change. */
export type PersistOp =
  | { kind: 'insert'; row: BallEventInsert }
  | { kind: 'angle'; id: string; angle: number }
  | { kind: 'void'; fromId: string };

/** Maps an accepted change to the write that saves it, or null when nothing needs saving. */
export function auditToOp(matchId: string, event: AuditEvent): PersistOp | null {
  switch (event.type) {
    case 'start':
      return { kind: 'insert', row: {
        id: event.id, match_id: matchId, innings: event.innings, kind: 'innings_start',
        striker_key: event.strikerId, non_striker_key: event.nonStrikerId, bowler_key: event.bowlerId,
      } };
    case 'delivery': {
      const { delivery } = event;
      // A dead ball changes nothing and is never accepted into the audit, but the type allows it.
      if (delivery.kind === 'dead') return null;
      return { kind: 'insert', row: {
        id: event.id, match_id: matchId, innings: event.innings, kind: 'delivery',
        striker_key: delivery.batterId, non_striker_key: event.nonStrikerId, bowler_key: delivery.bowlerId,
        delivery_kind: delivery.kind, runs: delivery.runs,
        total_runs: delivery.total, is_legal: delivery.legal, dismissal: delivery.dismissal ?? null,
        out_key: delivery.outId || null, next_batter_key: delivery.nextBatterId || null,
        fielder_key: delivery.fielderId || null,
      } };
    }
    case 'bowler':
      return { kind: 'insert', row: {
        id: event.id, match_id: matchId, innings: event.innings, kind: 'bowler', bowler_key: event.playerId,
      } };
    case 'swap':
      return { kind: 'insert', row: { id: event.id, match_id: matchId, innings: event.innings, kind: 'swap_ends' } };
    case 'shot':
      // A skipped shot leaves the stored direction empty, so only a chosen direction is written.
      return event.deliveryId && event.angle !== undefined
        ? { kind: 'angle', id: event.deliveryId, angle: event.angle } : null;
    case 'undo':
      return { kind: 'void', fromId: event.deliveryId };
    case 'demo':
      return null;
  }
}

/** Fields the scorer needs back from a saved delivery. A row without a delivery type is corrupt. */
export function rowToInput(row: BallEventRow): DeliveryInput {
  if (!row.delivery_kind) throw new Error('A saved delivery is missing its type.');
  return {
    kind: row.delivery_kind, runs: row.runs ?? 0,
    dismissal: row.dismissal ?? undefined, outId: row.out_key ?? undefined,
    nextBatterId: row.next_batter_key ?? undefined, fielderId: row.fielder_key ?? undefined,
  };
}
