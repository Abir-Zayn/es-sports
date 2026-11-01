/**
 * Local types for the scorer handover tables and functions (migration 20261101030000). They stand in for the
 * generated `database.types.ts` until it is regenerated from that migration and merged; then the row types can
 * come from `Tables<'scorer_handover'>` and the client wrapper in `handover-client.ts` can go.
 */

export type HandoverStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'expired';

/** A `public.scorer_handover` row as the server returns it. */
export type HandoverRow = {
  id: string;
  match_id: string;
  from_user: string;
  to_user: string;
  initiated_by: string;
  status: HandoverStatus;
  expires_at: string;
  created_at: string;
  resolved_at: string | null;
};

export type Handover = {
  id: string;
  matchId: string;
  fromUser: string;
  toUser: string;
  initiatedBy: string;
  status: HandoverStatus;
  /** ISO time after which a pending offer no longer counts, whatever its stored status says. */
  expiresAt: string;
};

/** What the creator's "Take over scoring" decision rests on. The server still decides at offer and accept. */
export type TakeoverFacts = {
  creatorId: string;
  /** The current scorer: the assigned one, else the creator. */
  scorerId: string;
  status: string;
  friendly: boolean;
  /** Server time of the newest ball, or null when none was written. */
  lastBallAt: string | null;
};

/** The server's idle limit for a creator takeover and its expiry for an offer, in minutes. */
export const HANDOVER_MINUTES = 15;
