import { supabase } from '@/lib/supabase';

import { FRIENDLY_REF_PREFIX } from '../data/match-rows';
import { callHandover, handoverTable } from './handover-client';
import { toHandoverError } from './handover-errors';
import { isOpen } from './handover-rules';
import type { Handover, HandoverRow, TakeoverFacts } from './types';

const LIST_LIMIT = 20;

export function toHandover(row: HandoverRow): Handover {
  return {
    id: row.id, matchId: row.match_id, fromUser: row.from_user, toUser: row.to_user, initiatedBy: row.initiated_by,
    status: row.status, expiresAt: row.expires_at,
  };
}

async function call(name: Parameters<typeof callHandover>[0], args: Record<string, string>, who?: string | null): Promise<string | null> {
  try {
    return await callHandover(name, args);
  } catch (error: unknown) {
    throw toHandoverError(error, who);
  }
}

/** Offers scoring to `toUser` and returns the offer's id. `who` names the current scorer for the "active a moment ago" refusal. */
export async function offerHandover(matchId: string, toUser: string, who?: string | null): Promise<string> {
  const id = await call('offer_scorer_handover', { p_match: matchId, p_to: toUser }, who);
  if (!id) throw toHandoverError(null);
  return id;
}

/** `who` names the scorer for the "active a moment ago" refusal of a creator takeover. */
export async function acceptHandover(id: string, who?: string | null): Promise<void> {
  await call('accept_scorer_handover', { p_id: id }, who);
}

export async function declineHandover(id: string): Promise<void> {
  await call('decline_scorer_handover', { p_id: id });
}

export async function cancelHandover(id: string): Promise<void> {
  await call('cancel_scorer_handover', { p_id: id });
}

async function rows(query: PromiseLike<{ data: HandoverRow[] | null; error: { message: string } | null }>): Promise<Handover[]> {
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toHandover);
}

/** The offer still waiting on this match, or null. A stored `pending` row past its expiry does not count. */
export async function fetchOpenHandover(matchId: string, now = Date.now()): Promise<Handover | null> {
  const list = await rows(handoverTable().eq('match_id', matchId).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(LIST_LIMIT));
  return list.find((handover) => isOpen(handover, now)) ?? null;
}

/** Offers waiting for this account to accept, newest first. */
export async function fetchIncomingHandovers(userId: string, now = Date.now()): Promise<Handover[]> {
  const list = await rows(handoverTable().eq('to_user', userId).eq('status', 'pending')
    .order('created_at', { ascending: false }).limit(LIST_LIMIT));
  return list.filter((handover) => isOpen(handover, now));
}

/** How the match's newest closed offer ended (declined, cancelled, expired or accepted), or null when there is none. */
export async function fetchEndedHandover(matchId: string): Promise<Handover | null> {
  const [latest] = await rows(handoverTable().eq('match_id', matchId).neq('status', 'pending')
    .order('created_at', { ascending: false }).limit(1));
  return latest ?? null;
}

/**
 * The newest accepted handover of the match, which names who took scoring over. The old scorer can no longer read
 * `match_scorers`, but may still read the offer they made.
 */
export async function fetchAcceptedHandover(matchId: string): Promise<Handover | null> {
  const [latest] = await rows(handoverTable().eq('match_id', matchId).eq('status', 'accepted')
    .order('created_at', { ascending: false }).limit(1));
  return latest ?? null;
}

/** Display names of profiles, by id. Ids without a name are left out. */
export async function fetchNames(ids: string[]): Promise<Record<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.from('profiles').select('id, full_name').in('id', unique);
  if (error) throw error;
  return Object.fromEntries((data ?? []).flatMap((row) => (row.full_name ? [[row.id, row.full_name]] : [])));
}

/** An offer with the words the banner and the offer screen show: who sent it and which match it is for. */
export type IncomingOffer = Handover & { fromName: string; teamA: string; teamB: string };

/** Offers waiting for this account, each with the sender's name and the two teams. */
export async function fetchIncomingOffers(userId: string, now = Date.now()): Promise<IncomingOffer[]> {
  const list = await fetchIncomingHandovers(userId, now);
  if (list.length === 0) return [];
  const matches = await supabase.from('matches').select('id, team_a_name, team_b_name').in('id', list.map((h) => h.matchId));
  if (matches.error) throw matches.error;
  const names = await fetchNames(list.map((h) => h.fromUser));
  return list.map((handover) => {
    const match = (matches.data ?? []).find((row) => row.id === handover.matchId);
    return {
      ...handover, fromName: names[handover.fromUser] ?? 'The scorer',
      teamA: match?.team_a_name ?? 'Team A', teamB: match?.team_b_name ?? 'Team B',
    };
  });
}

/**
 * The creator takes scoring from a scorer who has been idle: an offer to themselves, accepted at once. The server
 * checks the idle rule at both steps. If the accept is refused, the offer is cancelled so it cannot block the scorer.
 */
export async function takeOverScoring(matchId: string, userId: string, scorerName?: string | null): Promise<void> {
  const id = await offerHandover(matchId, userId, scorerName);
  try {
    await acceptHandover(id, scorerName);
  } catch (error: unknown) {
    await cancelHandover(id).catch(() => undefined);
    throw error;
  }
}

/** The match, its scorer and its newest ball: what decides whether the creator may be offered a takeover. */
export async function fetchTakeoverFacts(matchId: string): Promise<TakeoverFacts | null> {
  const match = await supabase.from('matches').select('created_by, status, fixture_ref').eq('id', matchId).maybeSingle();
  if (match.error) throw match.error;
  if (!match.data) return null;
  const scorer = await supabase.from('match_scorers').select('user_id').eq('match_id', matchId).limit(1).maybeSingle();
  if (scorer.error) throw scorer.error;
  const ball = await supabase.from('ball_events').select('created_at').eq('match_id', matchId)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (ball.error) throw ball.error;
  const creatorId = match.data.created_by ?? '';
  return {
    creatorId, scorerId: scorer.data?.user_id ?? creatorId, status: match.data.status,
    friendly: (match.data.fixture_ref ?? '').startsWith(FRIENDLY_REF_PREFIX), lastBallAt: ball.data?.created_at ?? null,
  };
}
