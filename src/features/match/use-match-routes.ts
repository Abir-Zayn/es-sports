import { useRouter } from 'expo-router';

import { comingSoon } from '@/lib/coming-soon';

import type { MatchTabId } from './types';

export const matchTabs: { id: MatchTabId; label: string }[] = [
  { id: 'live', label: 'Live' },
  { id: 'scorecard', label: 'Scorecard' },
  { id: 'overs', label: 'Overs' },
  { id: 'wagon', label: 'Wagon' },
  { id: 'info', label: 'Info' },
];

/** What a match is doing, which decides the screen shown first. */
export type MatchState = 'live' | 'upcoming' | 'result';

/** Navigation within one match's screens. Switching tabs replaces the screen so Back leaves the match. */
export function useMatchRoutes(id: string) {
  const router = useRouter();

  function openTab(tab: MatchTabId) {
    if (tab === 'live') return router.replace({ pathname: '/match/[id]', params: { id } });
    comingSoon(matchTabs.find((t) => t.id === tab)?.label ?? 'This');
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return { openTab, goBack };
}

/** Opens a match from anywhere: live matches on Live, finished ones on the scorecard, upcoming ones on Info. */
export function useOpenMatch() {
  const router = useRouter();
  return (id: string, state: MatchState) => {
    if (state === 'live') return router.push({ pathname: '/match/[id]', params: { id } });
    comingSoon('Match');
  };
}
