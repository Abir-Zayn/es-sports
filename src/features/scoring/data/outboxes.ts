import { fetchEvents, signedInUserId } from './match-repository';
import { sendOutboxOp } from './outbox-ops';
import { defaultOutboxStore } from './outbox-store';
import { Outbox, type OutboxDeps } from './outbox';

/**
 * Keeps one `Outbox` per account and match for the whole app run, so a scorer screen that is closed and opened
 * again, or recovery running at start-up, always talks to the same queue and never sends a change twice.
 */
export function createOutboxRegistry(deps: OutboxDeps) {
  const open = new Map<string, Outbox>();
  const key = (userId: string, matchId: string) => `${userId}/${matchId}`;

  /** The outbox for a match, picking up any changes an earlier run left on the phone. */
  function outboxFor(userId: string, matchId: string, fixtureRef: string): Outbox {
    const existing = open.get(key(userId, matchId));
    if (existing) return existing;
    const stored = deps.store.read(userId, matchId);
    const box = new Outbox(stored ?? { version: 1, userId, matchId, fixtureRef, base: [], ops: [] }, deps);
    open.set(key(userId, matchId), box);
    return box;
  }

  /** Every outbox of this account with unsent changes, in memory or on the phone. */
  function pendingFor(userId: string): Outbox[] {
    const stored = deps.store.list(userId).map((record) => outboxFor(userId, record.matchId, record.fixtureRef));
    const live = [...open.values()].filter((box) => box.userId === userId && box.pending > 0);
    return [...new Set([...live, ...stored])];
  }

  return {
    outboxFor,

    /**
     * Sends what is still unsent for the match a scorer route names (a match id or a fixture reference) before
     * that match is read, so the screen opens on the full score. Throws while anything is left unsent.
     */
    async recover(userId: string, routeId: string): Promise<void> {
      const matching = pendingFor(userId).filter((box) => box.matchId === routeId || box.fixtureRef === routeId);
      for (const box of matching) await box.flush();
    },

    /** Sends everything this account left unsent. Failures stay on the phone for the scorer screen to report. */
    async recoverAll(userId: string): Promise<void> {
      await Promise.all(pendingFor(userId).map((box) => box.flush().catch(() => undefined)));
    },

    /** Throws away unsent changes after the person chose to keep the newer score on the server. */
    discard(userId: string, matchId: string): void {
      const record = deps.store.read(userId, matchId);
      if (record) deps.store.write({ ...record, ops: [] });
      open.delete(key(userId, matchId));
    },
  };
}

export const outboxes = createOutboxRegistry({
  store: defaultOutboxStore(),
  send: sendOutboxOp,
  currentUserId: signedInUserId,
  fetchLiveIds: async (matchId) => (await fetchEvents(matchId)).map((row) => row.id),
});
