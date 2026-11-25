import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import type { TournamentSectionId } from '../sections';
import { RealTournamentScreen } from './real-tournament-screen';

/** A tournament route: read from the server, and an id that names no tournament shows "not found". */
export function tournamentRoute(section: TournamentSectionId): ComponentType {
  return function TournamentRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return <RealTournamentScreen id={id ?? ''} section={section} />;
  };
}
