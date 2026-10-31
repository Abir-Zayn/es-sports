import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { LiveBattersCard, LiveBowlerCard } from './components/live-scoring-tables';
import { LiveHero } from './components/live-hero';
import { MatchLoadState, StaleMatchNote } from './components/match-load-state';
import { MatchScreenFrame } from './components/match-screen-frame';
import { MatchTabs } from './components/match-tabs';
import { StreamLinkCard } from './components/stream-link-card';
import { ThisOverCard } from './components/this-over-card';
import type { LiveMatchViewData } from './live/live-view';
import { useLiveMatchData } from './use-live-match-data';
import { useMatchRoutes } from './use-match-routes';

/** The match as it happens: scores and chase or result, batters, bowler and the over being bowled. */
export function MatchLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? '';
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack } = useMatchRoutes(matchId);
  const live = useLiveMatchData(matchId);

  if (!live.data) {
    // The frame keeps the back button and tabs, so a match that failed to load is never a dead end.
    return <MatchScreenFrame matchId={matchId} tab="live"><MatchLoadState query={live} label="Loading match" /></MatchScreenFrame>;
  }
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={live.isRefetching} onRefresh={() => void live.refetch()} tintColor={colors.textMuted} />}>
      <LiveHero view={live.data} onBack={goBack} onShare={() => comingSoon('Sharing')} />
      <View style={styles.tabs}>
        <MatchTabs matchId={matchId} selected="live" />
      </View>
      <View style={styles.stale}><StaleMatchNote query={live} /></View>
      <LiveBody view={live.data} matchId={matchId} />
    </ScrollView>
  );
}

function LiveBody({ view, matchId }: { view: LiveMatchViewData; matchId: string }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { openTab } = useMatchRoutes(matchId);
  const [current = null, ...earlier] = view.recentOvers;
  return (
    <View style={styles.body}>
      {view.source === 'sample' ? (
        <Text muted style={styles.note}>Preview match. Live scores show here once this match is being scored.</Text>
      ) : null}
      {view.header.toss && view.header.status !== 'scheduled' ? <Text muted style={styles.note}>{view.header.toss}</Text> : null}
      {view.stream ? (
        <StreamLinkCard label={view.stream.label} source={view.stream.source} onPress={() => comingSoon('Live stream')} />
      ) : null}
      {view.crease ? (
        <>
          <LiveBattersCard batters={view.crease.batters} partnership={view.crease.partnership} />
          {view.crease.bowler ? <LiveBowlerCard bowler={view.crease.bowler} /> : null}
        </>
      ) : (
        <Text muted style={styles.note}>The crease and the over appear here once the first ball is bowled.</Text>
      )}
      {view.header.status === 'scheduled' ? null : <ThisOverCard current={current} previous={earlier.slice(0, 2)} />}
      {view.recentOvers.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab('overs')}
          style={({ pressed }) => [styles.allOvers, pressed && styles.pressed]}
        >
          <Text style={styles.allOversText}>See all overs</Text>
          <ChevronRight size={16} color={colors.text} strokeWidth={2.2} />
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
    tabs: { paddingTop: 14 },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 20, gap: 18 },
    note: { fontSize: 13, lineHeight: 18 },
    allOvers: {
      height: 48,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.outline,
    },
    pressed: { opacity: 0.7 },
    allOversText: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  });
