import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import ArrowUpRight from 'lucide-react-native/icons/arrow-up-right';
import Plus from 'lucide-react-native/icons/plus';
import Trophy from 'lucide-react-native/icons/trophy';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { competitionFormats } from './draft';
import { draftQueryKey, loadDraft } from './draft-storage';
import { MyTournamentsSection } from './my-tournaments-section';

export function TournamentDraftsScreen() {
  const router = useRouter();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const userId = session?.user.id ?? '';
  const { data: draft, isPending, isError, refetch } = useQuery({ queryKey: draftQueryKey(userId), queryFn: () => loadDraft(userId), enabled: Boolean(userId) });
  useFocusEffect(useCallback(() => { if (userId) void refetch(); }, [refetch, userId]));
  const openSetup = () => router.push('/tournament/create');
  return <ScrollView style={styles.screen} contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.xl, paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom }]}>
    <View style={styles.header}>
      <View style={styles.flex}><Text style={styles.kicker}>ORGANIZER DESK</Text><Text variant="title" accessibilityRole="header">Tournaments</Text></View>
      <View style={styles.icon}><Trophy size={25} color={colors.link} /></View>
    </View>
    {saved === '1' && Boolean(draft) ? <View style={styles.notice}><Text accessibilityLiveRegion="polite">Draft saved on this device.</Text></View> : null}
    {isPending ? <ActivityIndicator color={colors.link} accessibilityLabel="Loading tournaments" /> : isError ? <View style={styles.panel}>
      <Text variant="heading">Could not load your draft</Text><Text muted>Your saved setup has not been changed.</Text>
      <Button label="Try again" onPress={() => { void refetch(); }} />
    </View> : draft ? <View style={styles.stack}>
      <Text variant="heading" accessibilityRole="header">Your draft</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Continue setup for ${draft.name || 'Untitled tournament'}`} onPress={openSetup}
        style={({ pressed }) => [styles.panel, pressed && styles.pressed]}>
        <View style={styles.cardTop}><View style={styles.badge}><Text variant="caption" style={styles.badgeText}>SETUP DRAFT</Text></View><ArrowUpRight size={22} color={colors.link} /></View>
        <Text variant="heading">{draft.name || 'Untitled tournament'}</Text>
        <Text muted>{draft.city || 'Location to be added'}</Text>
        <Text variant="caption" muted>{`${draft.matchFormat} · ${draft.teams} teams · ${competitionFormats.find((item) => item.value === draft.competition)?.label ?? ''}`}</Text>
        <Text style={styles.link}>Continue setup</Text>
      </Pressable>
      <Text variant="caption" muted>This draft is private to your account on this device. It has not been published.</Text>
    </View> : <View style={styles.empty}>
      <View style={styles.art}><Trophy size={64} color={colors.link} strokeWidth={1.3} /></View>
      <Text variant="title" accessibilityRole="header" style={styles.emptyTitle}>Great cricket.{ '\n' }Your tournament.</Text>
      <Text muted style={styles.center}>Give your next competition a home. Set the basics, choose your format, and save your plan.</Text>
      <Button label="Create tournament" leading={<Plus size={20} color={colors.primaryText} />} onPress={openSetup} />
      <Text variant="caption" muted style={styles.center}>Start with a private draft. Teams and fixtures come later.</Text>
    </View>}
    <MyTournamentsSection userId={userId} />
  </ScrollView>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.gutter, gap: spacing.xl, maxWidth: 600, width: '100%', alignSelf: 'center' },
  header: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' }, flex: { flex: 1, gap: spacing.sm },
  kicker: { color: colors.link, fontSize: 11, lineHeight: 16, fontWeight: '700', letterSpacing: 1.4 },
  icon: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: spacing.lg }, panel: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.xl, gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, badge: { borderRadius: radius.pill, backgroundColor: colors.accentSoft, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeText: { color: colors.accent, letterSpacing: 1, fontWeight: '700', fontSize: 11 }, link: { color: colors.link, fontWeight: '600', marginTop: spacing.sm },
  notice: { padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.primarySoft },
  empty: { paddingVertical: spacing.xxl, gap: spacing.xl }, art: { width: 112, height: 112, alignSelf: 'center', borderRadius: 36, backgroundColor: colors.primarySoft, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
  emptyTitle: { textAlign: 'center', fontSize: 32, lineHeight: 40, letterSpacing: -0.6 }, center: { textAlign: 'center' }, pressed: { opacity: 0.75 },
});
