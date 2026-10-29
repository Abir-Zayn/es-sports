import { useLocalSearchParams, useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import { CareerStatsGrid } from './components/career-stats-grid';
import { PlayerHeroCard } from './components/player-hero-card';
import { PlayerPitchZones } from './components/player-pitch-zones';
import { PlayerRecentMatches } from './components/player-recent-matches';
import { usePlayerProfile } from './use-player-profile';

export function PlayerProfileScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string; role?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const player = usePlayerProfile(params.id ?? '', params.name, params.role);
  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" style={styles.back} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Career profile</Text>
      </View>
      <PlayerHeroCard player={player} />
      <CareerStatsGrid totals={player.totals} />
      <PlayerPitchZones shots={player.shots} />
      <PlayerRecentMatches matches={player.recent} />
    </ScrollView>
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, content: { paddingHorizontal: 20, gap: 26 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  back: { width: 48, height: 48, borderRadius: 24, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center' },
  title: { color: c.text, fontSize: 22, fontWeight: '700', lineHeight: 28 },
});
