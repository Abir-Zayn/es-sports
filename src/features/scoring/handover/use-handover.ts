import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import {
  acceptHandover, cancelHandover, declineHandover, fetchAcceptedHandover, fetchEndedHandover, fetchIncomingOffers, fetchNames,
  fetchOpenHandover, fetchTakeoverFacts, offerHandover, takeOverScoring,
} from './handover-repository';

/** How often a waiting offer is read again, so a decline or an accept shows without leaving the screen. */
const WAITING_REFRESH_MS = 8_000;
const TICK_MS = 15_000;

export const handoverKeys = {
  open: (matchId: string) => ['handover', 'open', matchId] as const,
  incoming: (userId: string) => ['handover', 'incoming', userId] as const,
  accepted: (matchId: string) => ['handover', 'accepted', matchId] as const,
  takeover: (matchId: string) => ['handover', 'takeover', matchId] as const,
  names: (ids: string[]) => ['handover', 'names', ...[...ids].sort()] as const,
};

/** The current time, refreshed every 15 seconds while `active`, so an expiry shows without a refetch. */
export function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // The first read comes at once, so a clock left behind while inactive is not trusted for a whole tick.
    const first = setTimeout(() => setNow(Date.now()), 0);
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [active]);
  return now;
}

/** The offer still waiting on this match; read again every few seconds while there is one. */
export function useOpenHandover(matchId: string, enabled: boolean) {
  return useQuery({
    queryKey: handoverKeys.open(matchId), queryFn: () => fetchOpenHandover(matchId), enabled: enabled && matchId.length > 0,
    staleTime: 0, refetchInterval: (query) => (query.state.data ? WAITING_REFRESH_MS : false),
  });
}

/** Offers waiting for this account. The screen that shows them refetches on focus. */
export function useIncomingOffers(userId: string | undefined) {
  return useQuery({
    queryKey: handoverKeys.incoming(userId ?? ''), queryFn: () => fetchIncomingOffers(userId ?? ''),
    enabled: Boolean(userId), staleTime: 0,
  });
}

export function useNames(ids: string[]) {
  return useQuery({ queryKey: handoverKeys.names(ids), queryFn: () => fetchNames(ids), enabled: ids.length > 0, staleTime: 60_000 });
}

/** How the match's last offer ended, read once when a waiting offer disappears. */
export function useEndedHandover(matchId: string, enabled: boolean) {
  return useQuery({ queryKey: ['handover', 'ended', matchId], queryFn: () => fetchEndedHandover(matchId), enabled, staleTime: 0 });
}

/** Who scoring moved to, for the scorer whose writes now fail. Null until known, or when no handover explains it. */
export function useNewScorerName(matchId: string, userId: string) {
  const accepted = useQuery({ queryKey: handoverKeys.accepted(matchId), queryFn: () => fetchAcceptedHandover(matchId), staleTime: 0 });
  const handover = accepted.data && accepted.data.fromUser === userId ? accepted.data : null;
  const names = useNames(handover ? [handover.toUser] : []);
  const loading = accepted.isPending || (handover !== null && names.isPending);
  return { loading, name: handover ? names.data?.[handover.toUser] ?? null : null };
}

/** What the creator's takeover button rests on: the match, its scorer's name and the newest ball. */
export function useTakeoverFacts(matchId: string, enabled: boolean) {
  const facts = useQuery({
    queryKey: handoverKeys.takeover(matchId), queryFn: () => fetchTakeoverFacts(matchId), enabled: enabled && matchId.length > 0, staleTime: 0,
  });
  const names = useNames(facts.data ? [facts.data.scorerId] : []);
  return { facts: facts.data ?? null, scorerName: facts.data ? names.data?.[facts.data.scorerId] ?? null : null, refetch: facts.refetch };
}

/** Offer and cancel for the scorer's screen. Both refresh the waiting offer afterwards, win or lose. */
export function useHandoverActions(matchId: string) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: handoverKeys.open(matchId) });
  const offer = useMutation({ mutationFn: (toUser: string) => offerHandover(matchId, toUser), onSettled: refresh });
  const cancel = useMutation({ mutationFn: (id: string) => cancelHandover(id), onSettled: refresh });
  return { offer, cancel };
}

/** Accept and decline for the person an offer is addressed to. */
export function useAnswerHandover(userId: string | undefined) {
  const client = useQueryClient();
  const refresh = () => client.invalidateQueries({ queryKey: handoverKeys.incoming(userId ?? '') });
  const accept = useMutation({ mutationFn: (v: { id: string; who: string }) => acceptHandover(v.id, v.who), onSettled: refresh });
  const decline = useMutation({ mutationFn: (id: string) => declineHandover(id), onSettled: refresh });
  return { accept, decline };
}

/** The creator's takeover. Afterwards the facts are read again, since the scorer has changed or the idle rule refused. */
export function useTakeover(matchId: string, userId: string | undefined) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (scorerName: string | null) => takeOverScoring(matchId, userId ?? '', scorerName),
    onSettled: () => client.invalidateQueries({ queryKey: handoverKeys.takeover(matchId) }),
  });
}
