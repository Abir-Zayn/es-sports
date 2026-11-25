import { useLocalSearchParams, useRouter } from 'expo-router';
import ArrowLeft from 'lucide-react-native/icons/arrow-left';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import { CareerStatsGrid } from './components/career-stats-grid';
import { PlayerHeroCard } from './components/player-hero-card';
import { PlayerPitchZones } from './components/player-pitch-zones';
import { PlayerRecentMatches } from './components/player-recent-matches';
import { RealPlayerProfile } from './real-player-profile';
import { usePlayerProfile } from './use-player-profile';
import { isUuid } from '@/features/scoring/data/uuid';

export function PlayerProfileScreen() {
  const params = useLocalSearchParams<{ id?: string; name?: string; role?: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const id = params.id ?? '';
  const player = usePlayerProfile(id, params.name, params.role);
  // A real account (e.g. from search or the Hall of fame) loads from the server; a squad name without an account stays local.
  const real = isUuid(id);
  return <View style={styles.screen}>
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xxl }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('common.goBack')} style={({ pressed }) => [styles.back, pressed && styles.pressed]} onPress={() => router.canGoBack() ? router.back() : router.replace('/home')}>
          <ArrowLeft size={sizes.icon} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>{t('players.title')}</Text>
      </View>
      {real ? <RealPlayerProfile id={id} name={params.name} /> : <>
        <PlayerHeroCard player={player} />
        <CareerStatsGrid totals={player.totals} />
        <PlayerPitchZones shots={player.shots} />
        <PlayerRecentMatches matches={player.recent} />
      </>}
    </ScrollView>
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background }, content: { paddingHorizontal: sizes.gutter, gap: sizes.sectionGap },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  back: { width: sizes.iconButton, height: sizes.iconButton, borderRadius: radius.pill, backgroundColor: c.surface, justifyContent: 'center', alignItems: 'center', ...shadows.iconButton },
  pressed: { transform: [{ scale: 0.95 }] },
  title: { ...typography.headlineLg, color: c.text },
});
