import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Trophy from 'lucide-react-native/icons/trophy';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Button, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { tournamentErrorText } from '@/features/tournament/data/tournament-errors';
import { useTranslation, type TranslationKey } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { CARD_RATIO, FameCard } from './components/fame-card';
import { useHallOfFame, type HallPeriod } from './use-hall-of-fame';

const PERIODS: { id: HallPeriod; tab: TranslationKey; title: TranslationKey; intro: TranslationKey }[] = [
  { id: '1m', tab: 'hallOfFame.period1m', title: 'hallOfFame.title1m', intro: 'hallOfFame.intro1m' },
  { id: '3m', tab: 'hallOfFame.period3m', title: 'hallOfFame.title3m', intro: 'hallOfFame.intro3m' },
  { id: '6m', tab: 'hallOfFame.period6m', title: 'hallOfFame.title6m', intro: 'hallOfFame.intro6m' },
  { id: '1y', tab: 'hallOfFame.period1y', title: 'hallOfFame.title1y', intro: 'hallOfFame.intro1y' },
];
/** Gold leads at up to 300 wide; silver sits a step smaller, so rank reads at a glance. Both keep card text ≥ 12. */
const GOLD_MAX = dp(300);
const SILVER_SCALE = 0.88;

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
  const options: SegmentedOption<HallPeriod>[] = PERIODS.map((p) => ({ id: p.id, label: t(p.tab) }));
  const goldWidth = Math.max(0, Math.min(screenWidth - sizes.gutter * 2, GOLD_MAX));
  const widthOf = (tier: 'gold' | 'silver') => Math.round(tier === 'gold' ? goldWidth : goldWidth * SILVER_SCALE);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel={t('common.back')}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text variant="title" accessibilityRole="header">{t('routes.hallOfFame')}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={totals.isRefetching} onRefresh={() => void totals.refetch()} tintColor={colors.link} />}>
        <SegmentedControl options={options} selected={period} onSelect={setPeriod} height={dp(44)} accessibilityLabel={t('hallOfFame.periodA11y')} />
        <Text muted>{t(current.intro)}</Text>
        {totals.isPending ? (
          // Placeholders the size of the cards, so nothing jumps when the winners arrive.
          <View style={styles.cards} accessible accessibilityLabel={t('hallOfFame.loading')} accessibilityState={{ busy: true }}>
            {(['gold', 'silver'] as const).map((tier) => (
              <View key={tier} style={[styles.placeholder, { width: widthOf(tier), height: widthOf(tier) * CARD_RATIO }]} />
            ))}
          </View>
        ) : totals.isError ? (
          <View style={styles.status} accessibilityLiveRegion="polite">
            <Text muted>{tournamentErrorText(totals.error)}</Text>
            <Button label={t('common.retry')} variant="secondary" onPress={() => void totals.refetch()} />
          </View>
        ) : winners.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Trophy size={dp(28)} color={colors.textMuted} /></View>
            <Text style={styles.emptyTitle}>{t('hallOfFame.emptyTitle')}</Text>
            <Text muted style={styles.center}>{t('hallOfFame.emptyMessage')}</Text>
          </View>
        ) : (
          <>
            <View style={styles.cards}>
              {winners.map((winner) => (
                // A new period or a new winner starts face down again.
                <FameCard key={`${period}-${winner.tier}-${winner.player.profileId}`} winner={winner} width={widthOf(winner.tier)}
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
    cards: { alignItems: 'center', gap: spacing.xl },
    placeholder: { borderRadius: radius.lg, backgroundColor: colors.surfaceRaised },
    rule: { ...typography.bodySm, textAlign: 'center' },
    status: { gap: spacing.md, paddingVertical: spacing.xl },
    empty: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
    emptyIcon: { width: dp(56), height: dp(56), borderRadius: radius.pill, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { ...typography.labelMd, textAlign: 'center' },
    center: { textAlign: 'center' },
  });
