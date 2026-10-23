import { useRouter } from 'expo-router';

import type { TeamTabId } from './types';

export const teamTabs: { id: TeamTabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'squad', label: 'Squad' },
  { id: 'members', label: 'Members' },
  { id: 'matches', label: 'Matches' },
];

/** Navigation within one team's screens. Switching tabs replaces the screen so Back leaves the team. */
export function useTeamRoutes(id: string) {
  const router = useRouter();

  function openTab(tab: TeamTabId) {
    switch (tab) {
      case 'overview':
        return router.replace({ pathname: '/team/[id]', params: { id } });
      case 'squad':
        return router.replace({ pathname: '/team/[id]/squad', params: { id } });
      case 'members':
        return router.replace({ pathname: '/team/[id]/members', params: { id } });
      case 'matches':
        return router.replace({ pathname: '/team/[id]/matches', params: { id } });
    }
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  return { openTab, goBack };
}

/** Opens a team's page from anywhere. */
export function useOpenTeam() {
  const router = useRouter();
  return (id: string) => router.push({ pathname: '/team/[id]', params: { id } });
}
