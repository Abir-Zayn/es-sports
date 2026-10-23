import { useRouter } from 'expo-router';

import { comingSoon } from '@/lib/coming-soon';

import { tournamentSections, type TournamentSectionId } from './sample-data';

/** Navigation for one tournament's screens. Switching sections replaces the screen so Back leaves the tournament. */
export function useTournamentRoutes(id: string) {
  const router = useRouter();

  function openSection(section: TournamentSectionId) {
    switch (section) {
      case 'overview':
        return router.replace({ pathname: '/tournament/[id]', params: { id } });
      case 'matches':
        return router.replace({ pathname: '/tournament/[id]/matches', params: { id } });
      default:
        return comingSoon(tournamentSections.find((s) => s.id === section)?.label ?? 'This');
    }
  }

  function openHeadToHead() {
    comingSoon('Head to head');
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return { openSection, openHeadToHead, goBack };
}
