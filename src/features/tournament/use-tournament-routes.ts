import { useRouter } from 'expo-router';

import type { TournamentSectionId } from './sample-data';

/** Navigation for one tournament's screens. Switching sections replaces the screen so Back leaves the tournament. */
export function useTournamentRoutes(id: string) {
  const router = useRouter();

  function openSection(section: TournamentSectionId) {
    switch (section) {
      case 'overview':
        return router.replace({ pathname: '/tournament/[id]', params: { id } });
      case 'matches':
        return router.replace({ pathname: '/tournament/[id]/matches', params: { id } });
      case 'table':
        return router.replace({ pathname: '/tournament/[id]/table', params: { id } });
      case 'knockout':
        return router.replace({ pathname: '/tournament/[id]/knockout', params: { id } });
      case 'stats':
        return router.replace({ pathname: '/tournament/[id]/stats', params: { id } });
      case 'teams':
        return router.replace({ pathname: '/tournament/[id]/teams', params: { id } });
    }
  }

  function openHeadToHead() {
    router.push({ pathname: '/tournament/[id]/head-to-head', params: { id } });
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return { openSection, openHeadToHead, goBack };
}
