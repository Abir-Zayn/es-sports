import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import ArrowRight from 'lucide-react-native/icons/arrow-right';
import FileText from 'lucide-react-native/icons/file-text';
import { useCallback } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BOTTOM_NAV_CLEARANCE } from '@/components/navigation/bottom-nav';
import { AppIconTile, Button, Card, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from './draft';
import { clearDraft, draftQueryKey, loadDraft } from './draft-storage';
import { MyTournamentsSection } from './my-tournaments-section';

export function TournamentDraftsScreen() {
  const router = useRouter();
  const { saved } = useLocalSearchParams<{ saved?: string }>();
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const userId = session?.user.id ?? '';
  const queryClient = useQueryClient();
  const deletion = useMutation({ mutationFn: () => clearDraft(userId), onSuccess: () => queryClient.setQueryData(draftQueryKey(userId), null) });
  const { data: draft, isPending, isError, refetch } = useQuery({ queryKey: draftQueryKey(userId), queryFn: () => loadDraft(userId), enabled: Boolean(userId) });
  useFocusEffect(useCallback(() => { if (userId) void refetch(); }, [refetch, userId]));
  const openSetup = () => router.push('/tournament/create');
  const confirmDelete = () => {
    if (Platform.OS === 'web') {
      if (globalThis.confirm('Delete this saved tournament from this device?')) deletion.mutate();
      return;
    }
    Alert.alert('Delete draft?', 'This will permanently remove this saved tournament from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deletion.mutate() },
    ]);
  };
  const draftName = draft?.name || 'Untitled tournament';
  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, {
        paddingTop: insets.top + spacing.xl,
        paddingBottom: BOTTOM_NAV_CLEARANCE + insets.bottom,
      }]}
    >
      <View style={styles.header}>
        <Text style={styles.kicker}>Organizer desk</Text>
        <Text variant="title" accessibilityRole="header">Tournaments</Text>
      </View>
      {isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading your draft" />
      ) : isError ? (
        <Card padding="tight" style={styles.draftSection}>
          <Text variant="headlineMd" accessibilityRole="header">Could not load your draft</Text>
          <Text muted>Your saved setup has not been changed.</Text>
          <Button variant="secondary" label="Try again" onPress={() => { void refetch(); }} />
        </Card>
      ) : draft ? (
        <View style={styles.draftSection}>
          <Text variant="heading" accessibilityRole="header">Your draft</Text>
          <Card padding="none">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Continue setup for ${draftName}`}
              onPress={openSetup}
              style={({ pressed }) => [styles.draftRow, pressed && styles.pressed]}
            >
              <AppIconTile icon={FileText} borderRadius={radius.md} backgroundColor={colors.primarySoft} iconColor={colors.link} />
              <View style={styles.draftDetails}>
                <Text variant="headlineMd">{draftName}</Text>
                <Text variant="caption" muted>{draft.city || 'Location to be added'}</Text>
                <Text variant="caption" muted>{`${oversLabel(draft.overs)} · ${draft.teams} teams`}</Text>
                <Text style={styles.link}>Continue setup</Text>
              </View>
              <ArrowRight size={sizes.iconSmall} color={colors.link} />
            </Pressable>
            <View style={styles.draftFooter}>
              <Text variant="caption" muted style={styles.draftNote}>
                {saved === '1' ? <Text variant="caption" accessibilityLiveRegion="polite">Draft saved. </Text> : null}
                Private to your account on this device.
              </Text>
              <Button label="Delete draft" variant="ghost" loading={deletion.isPending} onPress={confirmDelete} />
            </View>
          </Card>
          {deletion.isError ? <Text accessibilityRole="alert">Could not delete your draft. Please try again.</Text> : null}
        </View>
      ) : null /* New tournaments start from the + button in the bottom bar. */}
      <MyTournamentsSection userId={userId} />
    </ScrollView>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: sizes.gutter, gap: sizes.sectionGap, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
  header: { gap: spacing.xs },
  kicker: { ...typography.labelUppercase, color: colors.link },
  draftSection: { gap: spacing.md },
  draftRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: sizes.cardPaddingTight },
  draftDetails: { flex: 1, gap: spacing.xs },
  link: { ...typography.labelMd, color: colors.link, marginTop: spacing.xs },
  draftFooter: {
    flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border,
    paddingStart: sizes.cardPaddingTight, paddingEnd: spacing.sm,
  },
  draftNote: { flexGrow: 1, flexBasis: dp(130) },
  pressed: { transform: [{ scale: 0.95 }] },
});
