import { useEffect, useMemo, useRef, useState } from 'react';

import { auditToOp } from './data/event-rows';
import type { SavedMark } from './data/load-scorer';
import { resultKey } from './data/load-scorer';
import { applyOp, createMatch, reopenMatch, saveResult } from './data/match-repository';
import { computeResult } from './data/match-result';
import { buildMatchRows } from './data/match-rows';
import { SyncQueue, type SyncSnapshot } from './data/sync-queue';
import type { ScorerSession } from './session-reducer';

/** `local` is the reference match, which is never sent anywhere. */
export type SyncInfo = SyncSnapshot & { mode: 'local' | 'synced'; retry: () => void };

type Args = { session: ScorerSession; matchId: string; fixtureRef: string; saved: SavedMark };

/**
 * Saves every change the scorer accepts. It follows the session's audit trail, so the reducer stays the
 * single place that decides what counts as a ball. Writes go through one ordered queue with retries; the
 * match row is created with the first innings, and the result is written when the chase ends (and cleared
 * again if that last ball is undone).
 */
export function useMatchSync({ session, matchId, fixtureRef, saved }: Args): SyncInfo {
  const [snapshot, setSnapshot] = useState<SyncSnapshot>({ status: 'idle', pending: 0 });
  const queue = useRef<SyncQueue | null>(null);
  const handled = useRef(saved.auditLength);
  const matchCreated = useRef(saved.matchExists);
  const storedResult = useRef(saved.resultKey);
  const local = session.audit.some((event) => event.type === 'demo');

  useEffect(() => {
    const next = new SyncQueue(setSnapshot);
    queue.current = next;
    return () => next.dispose();
  }, []);

  useEffect(() => {
    const jobs = queue.current;
    if (!jobs || local) return;
    for (; handled.current < session.audit.length; handled.current++) {
      const event = session.audit[handled.current];
      if (event.type === 'start' && !matchCreated.current) {
        matchCreated.current = true;
        const rows = buildMatchRows(matchId, fixtureRef, session.setup, new Date());
        jobs.push(() => createMatch(rows.match, rows.players, rows.scorers));
      }
      const op = auditToOp(matchId, event);
      if (op) jobs.push(() => applyOp(matchId, op));
    }
  }, [session.audit, session.setup, local, matchId, fixtureRef]);

  const result = useMemo(() => (session.score ? computeResult(session.score) : null), [session.score]);
  useEffect(() => {
    const jobs = queue.current;
    const key = resultKey(result);
    if (!jobs || local || key === storedResult.current) return;
    const hadResult = storedResult.current !== null;
    storedResult.current = key;
    if (result) {
      const done = { status: 'completed' as const, completed_at: new Date().toISOString(), ...result };
      jobs.push(() => saveResult(matchId, done));
    } else if (hadResult) {
      jobs.push(() => reopenMatch(matchId));
    }
  }, [result, local, matchId]);

  return { ...snapshot, mode: local ? 'local' : 'synced', retry: () => queue.current?.retry() };
}
