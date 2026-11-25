import { careerOf, useLedger } from '@/features/profile';
import { t } from '@/i18n';
import { addPerformances, emptyCareer } from '@/lib/career-stats';
import type { PlayingRole } from '@/types/profile';
import type { PlayerCareer } from './types';

const roles: readonly PlayingRole[] = ['batter', 'bowler', 'all-rounder', 'keeper'];
export function usePlayerProfile(id: string, name?: string, role?: string): PlayerCareer {
  const ledger = useLedger();
  const fallbackRole = roles.find((value) => value === role?.toLowerCase()) ?? 'batter';
  const fallbackName = name?.trim() || (/^[a-z][a-z.'-]+(?:\s+[a-z.'-]+)+$/i.test(id) ? id : t('players.fallbackName'));
  const player: PlayerCareer = {
    profile: { id, fullName: fallbackName, role: fallbackRole, battingStyle: 'right' },
    totals: emptyCareer, shots: [], recent: [],
  };
  const recorded = careerOf(ledger, player.profile.id);
  return { ...player, totals: addPerformances(player.totals, recorded.performances), recent: [...recorded.recent, ...player.recent].slice(0, 10) };
}
