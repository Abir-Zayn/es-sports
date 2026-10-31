import { useEffect, useMemo, useRef, useState } from 'react';

import { auditToOp } from './data/event-rows';
import type { SavedMark } from './data/load-scorer';
import { resultKey } from './data/load-scorer';
import { computeResult } from './data/match-result';
import { buildMatchRows } from './data/match-rows';
import type { OutboxSnapshot } from './data/outbox';
import { outboxes } from './data/outboxes';
import type { ScorerSession } from './session-reducer';

/** `local` is the reference match, which is never sent anywhere. */
export type SyncInfo = OutboxSnapshot & { mode: 'local' | 'synced'; retry: () => void };

type Args = { session: ScorerSession; userId: string; matchId: string; fixtureRef: string; saved: SavedMark };

/**
 * Saves every change the scorer accepts. It follows the session's audit trail, so the reducer stays the
 * single place that decides what counts as a ball. Writes go through the match's outbox, which keeps them on
 * the phone until the server has them; the match row is created with the first innings, and the result is
 * written when the chase ends (and cleared again if that last ball is undone).
 */
export function useMatchSync({ session, userId, matchId, fixtureRef, saved }: Args): SyncInfo {
  const local = session.audit.some((event) => event.type === 'demo');
  const outbox = useMemo(() => (local ? null : outboxes.outboxFor(userId, matchId, fixtureRef)), [local, userId, matchId, fixtureRef]);
  const [snapshot, setSnapshot] = useState<OutboxSnapshot>(() => outbox?.status ?? { status: 'idle', pending: 0 });
  const handled = useRef(saved.auditLength);
  const matchCreated = useRef(saved.matchExists);
  const startPending = useRef(saved.matchExists && saved.auditLength === 0);
  const storedResult = useRef(saved.resultKey);

  // The outbox outlives this screen, so leaving only stops listening; unsent changes keep going out.
  useEffect(() => outbox?.subscribe(setSnapshot), [outbox]);

  useEffect(() => {
    if (!outbox) return;
    for (; handled.current < session.audit.length; handled.current++) {
      const event = session.audit[handled.current];
      if (event.type === 'start' && !matchCreated.current) {
        matchCreated.current = true;
        const rows = buildMatchRows(matchId, fixtureRef, session.setup, new Date());
        outbox.push({ kind: 'create', match: rows.match, players: rows.players, scorers: rows.scorers });
      } else if (event.type === 'start' && startPending.current) {
        startPending.current = false;
        outbox.push({ kind: 'start', recordShots: session.setup.recordShots, startedAt: new Date().toISOString() });
      }
      const op = auditToOp(matchId, event);
      if (op) outbox.push({ kind: 'event', op });
    }
  }, [session.audit, session.setup, outbox, matchId, fixtureRef]);

  const result = useMemo(() => (session.score ? computeResult(session.score) : null), [session.score]);
  useEffect(() => {
    const key = resultKey(result);
    if (!outbox || key === storedResult.current) return;
    const hadResult = storedResult.current !== null;
    storedResult.current = key;
    if (result) {
      outbox.push({ kind: 'result', result: { status: 'completed', completed_at: new Date().toISOString(), ...result } });
    } else if (hadResult) {
      outbox.push({ kind: 'reopen' });
    }
  }, [result, outbox]);

  return { ...snapshot, mode: local ? 'local' : 'synced', retry: () => { outbox?.flush().catch(() => undefined); } };
}
