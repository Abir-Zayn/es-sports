import { useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { SquadPlayer } from '../types';

type Props = {
  player: SquadPlayer | null;
  tone: AvatarTone;
  visible: boolean;
  onClose: () => void;
  onSubstitute?: (player: SquadPlayer) => void;
};

/** Quick inspection modal displaying player stats (Highest Run, Total Matches, Total Wickets, Avg). */
export function PlayerDetailSheet({
  player,
  visible,
  onClose,
  onSubstitute,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const router = useRouter();

  if (!player) return null;

  const isCaptain = player.tag === 'C';
  const stats = player.stats ?? {
    highestRun: '50*',
    totalMatches: 10,
    totalWickets: 5,
    avg: '30.0',
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleCol}>
              <Text style={styles.sheetTitle}>Player Profile</Text>
              <Text muted style={styles.sheetSubtitle}>Playing XI</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.closeBtn}
            >
              <X size={dp(18)} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Profile header */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initialsOf(player.name)}</Text>
            </View>
            <View style={styles.infoCol}>
              <View style={styles.nameRow}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.tag ? (
                  <View style={styles.tagBadge}>
                    <Text style={styles.tagText}>
                      {isCaptain ? 'Captain' : 'WK'}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text muted style={styles.playerRole}>
                {player.role}
              </Text>
            </View>
          </View>

          {/* Player Result Stats: Highest Run, Total Matches, Total Wickets, Avg */}
          <View style={styles.statsSection}>
            <Text style={styles.statsSectionTitle}>Player Results</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statTile}>
                <Text muted style={styles.statLabel}>Highest Run</Text>
                <Text style={styles.statValue}>{stats.highestRun}</Text>
              </View>
              <View style={styles.statTile}>
                <Text muted style={styles.statLabel}>Total Matches</Text>
                <Text style={styles.statValue}>{String(stats.totalMatches)}</Text>
              </View>
              <View style={styles.statTile}>
                <Text muted style={styles.statLabel}>Total Wickets</Text>
                <Text style={styles.statValue}>{String(stats.totalWickets)}</Text>
              </View>
              <View style={styles.statTile}>
                <Text muted style={styles.statLabel}>Avg</Text>
                <Text style={styles.statValue}>{stats.avg}</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button label="View Full Career Profile" onPress={() => {
              onClose();
              router.push({ pathname: '/player/[id]', params: { id: player.id ?? player.name, name: player.name, role: player.role } });
            }} />
            {onSubstitute ? (
              <Button
                label="Substitute with Bench"
                variant="secondary"
                size="compact"
                onPress={() => {
                  onSubstitute(player);
                  onClose();
                }}
              />
            ) : null}
            <Button label="Done" variant="secondary" size="compact" onPress={onClose} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: sizes.gutter,
    },
    sheet: {
      width: '100%',
      maxWidth: dp(360),
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      ...shadows.card,
      padding: sizes.cardPadding,
      gap: spacing.lg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleCol: { gap: spacing.xs / 2 },
    sheetTitle: typography.headlineMd,
    sheetSubtitle: typography.bodySm,
    closeBtn: {
      width: dp(32),
      height: dp(32),
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: dp(48),
      height: dp(48),
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { ...typography.headlineMd, color: colors.text },
    infoCol: { flex: 1, gap: spacing.xs / 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    playerName: { ...typography.headlineMd, color: colors.text },
    playerRole: typography.bodySm,
    tagBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: dp(2),
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
    },
    tagText: { ...typography.labelSm, color: colors.link },
    statsSection: { gap: spacing.sm },
    statsSectionTitle: { ...typography.labelUppercase, color: colors.textMuted },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    statTile: {
      width: '48%',
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      gap: spacing.xs / 2,
    },
    statLabel: { ...typography.bodySm, color: colors.textMuted },
    statValue: { ...typography.headlineMd, fontVariant: ['tabular-nums'], color: colors.text },
    actions: { gap: spacing.sm, marginTop: spacing.xs },
  });
