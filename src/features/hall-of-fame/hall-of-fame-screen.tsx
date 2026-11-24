import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, AppTabs, Button, Text, type AppTab } from '@/components/ui';
import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';
import { useTranslation, type TranslationKey } from '@/i18n';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { FameCard } from './components/fame-card';
import { useHallOfFame, type HallPeriod } from './use-hall-of-fame';

const PERIODS: { id: HallPeriod; tab: TranslationKey; title: TranslationKey }[] = [
  { id: '1m', tab: 'hallOfFame.period1m', title: 'hallOfFame.title1m' },
  { id: '3m', tab: 'hallOfFame.period3m', title: 'hallOfFame.title3m' },
  { id: '6m', tab: 'hallOfFame.period6m', title: 'hallOfFame.title6m' },
  { id: '1y', tab: 'hallOfFame.period1y', title: 'hallOfFame.title1y' },
];
const CARD_GAP = spacing.md;

/** The two most valuable players across every tournament over the last 1, 3, 6 or 12 months, as gold and silver cards. */
export function HallOfFameScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const { width: screenWidth } = useWindowDimensions();
  const [period, setPeriod] = useState<HallPeriod>('1m');
  const { totals, winners, photos } = useHallOfFame(period);
  const current = PERIODS.find((p) => p.id === period) ?? PERIODS[0];
  const tabs: AppTab<HallPeriod>[] = PERIODS.map((p) => ({ id: p.id, label: t(p.tab) }));
  const cardWidth = Math.max(0, Math.floor((screenWidth - sizes.gutter * 2 - CARD_GAP) / 2));

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text variant="title" accessibilityRole="header">{t('routes.hallOfFame')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={totals.isRefetching} onRefresh={() => void totals.refetch()} tintColor={colors.link} />}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
          <AppTabs tabs={tabs} selected={period} onSelect={setPeriod} />
        </ScrollView>
        {totals.isPending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel={t('hallOfFame.loading')} style={styles.status} />
        ) : totals.isError ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <Text muted>{tournamentErrorText(totals.error)}</Text>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void totals.refetch()} />
          </View>
        ) : winners.length === 0 ? (
          <View style={styles.status}>
            <Text style={styles.emptyTitle}>{t('hallOfFame.emptyTitle')}</Text>
            <Text muted>{t('hallOfFame.emptyMessage')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.cards}>
              {winners.map((winner) => (
                // A new period or a new winner starts face down again.
                <FameCard key={`${period}-${winner.tier}-${winner.player.profileId}`} winner={winner} width={cardWidth}
                  photo={photos[winner.player.profileId]} title={t(current.title)}
                  onOpenPlayer={() => router.push({ pathname: '/player/[id]', params: { id: winner.player.profileId, name: winner.player.name } })} />
              ))}
            </View>
            <Text muted style={styles.rule}>{t('hallOfFame.rule')}</Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    content: { paddingHorizontal: sizes.gutter, paddingBottom: spacing.xl * 2, gap: spacing.lg },
    chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
    chips: { paddingHorizontal: sizes.gutter },
    cards: { flexDirection: 'row', gap: CARD_GAP },
    rule: typography.bodySm,
    status: { gap: spacing.md, paddingVertical: spacing.xl },
    emptyTitle: typography.labelMd,
  });
