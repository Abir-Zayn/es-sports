import { careerOf, useLedger } from '@/features/profile';
import { addPerformances, emptyCareer } from '@/lib/career-stats';
import type { PlayingRole } from '@/types/profile';
import { findSamplePlayer } from './sample-players';
import type { PlayerCareer } from './types';

const roles: readonly PlayingRole[] = ['batter', 'bowler', 'all-rounder', 'keeper'];
export function usePlayerProfile(id: string, name?: string, role?: string): PlayerCareer {
  const ledger = useLedger();
  const sample = findSamplePlayer(id);
  const fallbackRole = roles.find((value) => value === role?.toLowerCase()) ?? 'batter';
  const fallbackName = name?.trim() || (/^[a-z][a-z.'-]+(?:\s+[a-z.'-]+)+$/i.test(id) ? id : 'Player');
  const player: PlayerCareer = sample ?? {
    profile: { id, fullName: fallbackName, role: fallbackRole, battingStyle: 'right' },
    totals: emptyCareer, shots: [], recent: [], isSample: false,
  };
  const recorded = careerOf(ledger, player.profile.id);
  return { ...player, totals: addPerformances(player.totals, recorded.performances), recent: [...recorded.recent, ...player.recent].slice(0, 10) };
}
