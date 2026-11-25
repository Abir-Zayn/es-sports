import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import type { TeamTabId } from '../types';
import { RealTeamScreen } from './real-team-screen';

/** A team route: the team is read from the server, and an id that names no team shows "not found". */
export function teamRoute(tab: TeamTabId): ComponentType {
  return function TeamRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <RealTeamScreen id={id ?? ''} tab={tab} />;
  };
}
