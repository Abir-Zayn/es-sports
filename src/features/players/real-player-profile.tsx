import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useCareer } from '@/features/profile/career/use-career';
import { CareerStats } from '@/features/profile/sections/career-stats';
import { useTranslation } from '@/i18n';
import { emptyCareer } from '@/lib/career-stats';
import { traceApi } from '@/lib/api-log';
import { supabase } from '@/lib/supabase';
import { spacing, useTheme } from '@/theme';
import type { BattingStyle, PlayerProfile, PlayingRole } from '@/types/profile';

import { PlayerHeroCard } from './components/player-hero-card';
import { PlayerRecentMatches } from './components/player-recent-matches';

const ROLES: readonly PlayingRole[] = ['batter', 'bowler', 'all-rounder', 'keeper'];

/** Another account's public profile: name, photo, role and area. Phone and national id stay private. */
async function fetchPublicProfile(id: string, signal: AbortSignal): Promise<PlayerProfile | null> {
  const { data, error } = await traceApi('players.profile', { id }, () => supabase.from('profiles')
    .select('id, full_name, avatar_url, area, district, role, batting_style').eq('id', id).abortSignal(signal).maybeSingle());
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id, fullName: data.full_name?.trim() || '', avatarUri: data.avatar_url ?? undefined,
    area: data.area ?? undefined, district: data.district ?? undefined,
    role: ROLES.find((r) => r === data.role) ?? 'batter', battingStyle: (data.batting_style === 'left' ? 'left' : 'right') as BattingStyle,
  };
}

/** A real player's career from the server: their photo and details, career figures and recent matches, fresh on every visit. */
export function RealPlayerProfile({ id, name }: { id: string; name?: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const profile = useQuery({ queryKey: ['player-profile', id], queryFn: ({ signal }) => fetchPublicProfile(id, signal), staleTime: 0 });
  const career = useCareer(id);
  const fallbackName = name?.trim() || t('players.fallbackName');
  const bio: PlayerProfile = profile.data
    ? { ...profile.data, fullName: profile.data.fullName || fallbackName }
    : { id, fullName: fallbackName, role: 'batter', battingStyle: 'right' };

  return <>
    <PlayerHeroCard player={{ profile: bio, totals: emptyCareer, shots: [], recent: [], isSample: false }} />
    {career.status === 'loading' ? (
      <ActivityIndicator color={colors.link} accessibilityLabel={t('players.loadingCareer')} />
    ) : career.status === 'error' ? (
      <View style={{ gap: spacing.md }} accessibilityLiveRegion="polite">
        <Text muted>{t('players.careerFailed')}</Text>
        <Button label={t('common.retry')} variant="secondary" size="compact" onPress={career.reload} />
      </View>
    ) : (
      <CareerStats batting={career.batting} bowling={career.bowling} />
    )}
    <PlayerRecentMatches matches={career.recent} />
  </>;
}
