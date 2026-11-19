import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { isUuid } from '@/features/scoring/data/match-repository';
import { ResumeScoringAction } from '@/features/scoring/handover/components/resume-scoring-action';
import { comingSoon } from '@/lib/coming-soon';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { LiveBattersCard, LiveBowlerCard } from '../components/live-scoring-tables';
import { LiveHero } from '../components/live-hero';
import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchScreenFrame } from '../components/match-screen-frame';
import { MatchTabs } from '../components/match-tabs';
import { StreamLinkCard } from '../components/stream-link-card';
import { ThisOverCard } from '../components/this-over-card';
import type { LiveMatchViewData } from '../utils/live-view';
import { useLiveMatchData } from '../server/use-live-match-data';
import { useMatchRoutes } from '../utils/use-match-routes';

/** The match as it happens: scores and chase or result, batters, bowler and the over being bowled. */
export function MatchLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { goBack } = useMatchRoutes(matchId);
  const live = useLiveMatchData(matchId);

  if (!live.data) {
    // The frame keeps the back button and tabs, so a match that failed to load is never a dead end.
    return <MatchScreenFrame matchId={matchId} tab="live"><MatchLoadState query={live} label={t('match.loadingMatch')} /></MatchScreenFrame>;
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={live.isRefetching} onRefresh={() => void live.refetch()} tintColor={colors.textMuted} />}>
      <LiveHero view={live.data} onBack={goBack} onShare={() => comingSoon(t('match.shareFeature'))} />
      <MatchTabs matchId={matchId} selected="live" />
      <View style={styles.stale}><StaleMatchNote query={live} /></View>
      <LiveBody view={live.data} matchId={matchId} />
    </ScrollView>
  );
}

function LiveBody({ view, matchId }: { view: LiveMatchViewData; matchId: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { t } = useTranslation();
  const { openTab } = useMatchRoutes(matchId);
  const [current = null, ...earlier] = view.recentOvers;
  return (
    <View style={styles.body}>
      {view.source === 'sample' ? (
        <Text muted style={styles.note}>{t('match.live.previewNote')}</Text>
      ) : null}
      {view.source === 'stored' && view.header.status !== 'completed' && isUuid(matchId) ? <ResumeScoringAction matchId={matchId} /> : null}
      {view.header.toss && view.header.status !== 'scheduled' ? <Text muted style={styles.note}>{view.header.toss}</Text> : null}
      {view.stream ? (
        <StreamLinkCard label={view.stream.label} source={view.stream.source} onPress={() => comingSoon(t('match.liveStreamFeature'))} />
      ) : null}
      {view.crease ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text accessibilityRole="header" style={styles.sectionTitle}>{t('match.live.atCrease')}</Text>
          </View>
          <LiveBattersCard batters={view.crease.batters} partnership={view.crease.partnership} />
          {view.crease.bowler ? <LiveBowlerCard bowler={view.crease.bowler} /> : null}
        </View>
      ) : (
        <Text muted style={styles.note}>{t('match.live.waitFirstBall')}</Text>
      )}
      {view.header.status === 'scheduled' ? null : <ThisOverCard current={current} previous={earlier.slice(0, 2)} />}
      {view.recentOvers.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab('overs')}
          style={({ pressed }) => [styles.allOvers, pressed && styles.pressed]}
        >
          <Text style={styles.allOversText}>{t('match.live.seeAllOvers')}</Text>
          <ChevronRight size={sizes.iconSmall} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    stale: { paddingHorizontal: sizes.gutter },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    body: { paddingHorizontal: sizes.gutter, paddingTop: spacing.xl, gap: sizes.sectionGap },
    section: { gap: spacing.md },
    sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { ...typography.headlineMd, color: colors.text },
    note: typography.bodySm,
    allOvers: {
      minHeight: sizes.control,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    allOversText: typography.labelMd,
  });
