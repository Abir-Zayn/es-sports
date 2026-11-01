import { HANDOVER_MINUTES, type Handover, type TakeoverFacts } from './types';

const MINUTE_MS = 60_000;

const timeOf = (iso: string | null): number => (iso ? Date.parse(iso) : NaN);

/**
 * A pending row counts as open only while `expiresAt` is ahead of `now`. The server expires rows lazily, and a
 * call that raised ESH01 or ESH03 rolls its own expiry back, so a stale row can still say `pending`.
 */
export function isOpen(handover: Handover, now: number): boolean {
  const expires = timeOf(handover.expiresAt);
  return handover.status === 'pending' && Number.isFinite(expires) && expires > now;
}

/** Whole minutes until the offer expires, at least 1 while it is open and 0 once it is not. */
export function minutesLeft(handover: Handover, now: number): number {
  const expires = timeOf(handover.expiresAt);
  if (!Number.isFinite(expires) || !Number.isFinite(now) || expires <= now) return 0;
  return Math.max(1, Math.ceil((expires - now) / MINUTE_MS));
}

export function expiryText(handover: Handover, now: number): string {
  const left = minutesLeft(handover, now);
  return left === 0 ? 'Expired' : `Expires in ${left} min`;
}

/**
 * Whether to show the creator "Take over scoring": a live friendly, someone else scoring, and no ball for 15
 * minutes (or none at all). Only a hint for the button; the server checks it again at offer and at accept.
 */
export function canOfferTakeover(facts: TakeoverFacts | null | undefined, userId: string | undefined, now: number): boolean {
  if (!facts || !userId || !facts.friendly || facts.status !== 'live') return false;
  if (facts.creatorId !== userId || facts.scorerId === userId) return false;
  if (facts.lastBallAt === null) return true;
  const last = timeOf(facts.lastBallAt);
  return Number.isFinite(last) && now - last >= HANDOVER_MINUTES * MINUTE_MS;
}
