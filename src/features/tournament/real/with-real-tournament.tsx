import { useLocalSearchParams } from 'expo-router';
import type { ComponentType } from 'react';

import { isUuid } from '@/features/scoring/data/uuid';

import type { TournamentSectionId } from '../sample-data';
import { RealTournamentScreen } from './real-tournament-screen';

/**
 * A tournament route that shows the sample only for the sample ids. A real (uuid) id always reads the server, so
 * a real tournament is never shown as the sample tournament.
 */
export function withRealTournament(Sample: ComponentType, section: TournamentSectionId): ComponentType {
  return function TournamentRoute() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return id && isUuid(id) ? <RealTournamentScreen id={id} section={section} /> : <Sample />;
  };
}
