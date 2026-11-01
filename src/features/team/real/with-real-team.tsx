import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import { isUuid } from '@/features/scoring/data/uuid';

import type { TeamTabId } from '../types';
import { RealTeamScreen } from './real-team-screen';

/**
 * A team route that shows the sample only for the sample ids. A real (uuid) id always reads the server, so a
 * real team is never shown as the sample team.
 */
export function withRealTeam(Sample: ComponentType, tab: TeamTabId): ComponentType {
  return function TeamRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return id && isUuid(id) ? <RealTeamScreen id={id} tab={tab} /> : <Sample />;
  };
}
