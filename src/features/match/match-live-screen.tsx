import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { LiveBattersCard, LiveBowlerCard } from './components/live-scoring-tables';
import { LiveHero } from './components/live-hero';
import { MatchTabs } from './components/match-tabs';
import { StreamLinkCard } from './components/stream-link-card';
import { ThisOverCard } from './components/this-over-card';
import { liveSnapshot, matchHeader } from './sample-match';
import { oversData } from './sample-overs';
import { useMatchRoutes } from './use-match-routes';

/** The match as it happens: scores and chase, batters, bowler and the current over. */
export function MatchLiveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id ?? matchHeader.id;
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { goBack, openTab } = useMatchRoutes(matchId);
  const [current, ...earlier] = oversData.overs;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LiveHero label={matchHeader.label} live={liveSnapshot} onBack={goBack} onShare={() => comingSoon('Sharing')} />
      <View style={styles.tabs}>
        <MatchTabs matchId={matchId} selected="live" />
      </View>
      <View style={styles.body}>
        <StreamLinkCard
          label={liveSnapshot.streamLabel}
          source={liveSnapshot.streamSource}
          onPress={() => comingSoon('Live stream')}
        />
        <LiveBattersCard batters={liveSnapshot.batters} partnership={liveSnapshot.partnership} />
        <LiveBowlerCard bowler={liveSnapshot.bowler} />
        <ThisOverCard current={current} previous={earlier.slice(0, 2)} />
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab('overs')}
          style={({ pressed }) => [styles.allOvers, pressed && styles.pressed]}
        >
          <Text style={styles.allOversText}>See all overs</Text>
          <ChevronRight size={16} color={colors.text} strokeWidth={2.2} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    tabs: { paddingTop: 14 },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 20, gap: 18 },
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
