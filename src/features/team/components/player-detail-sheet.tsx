import { useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { radius, sizes, spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

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
              <X size={18} color="#9AA6A1" />
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
      maxWidth: 360,
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    titleCol: { gap: 2 },
    sheetTitle: { fontSize: 16, lineHeight: 20, fontWeight: '700' },
    sheetSubtitle: { fontSize: 12, lineHeight: 16 },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 17, lineHeight: 21, fontWeight: '800', color: colors.text },
    infoCol: { flex: 1, gap: 2 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    playerName: { fontSize: 16, lineHeight: 20, fontWeight: '700', color: colors.text },
    playerRole: { fontSize: 13, lineHeight: 17 },
    tagBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
    },
    tagText: { fontSize: 10, lineHeight: 12, fontWeight: '700', color: colors.link },
    statsSection: { gap: 6 },
    statsSectionTitle: {
      fontSize: 11,
      lineHeight: 14,
      fontWeight: '700',
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    statTile: {
      width: '48%',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 10,
      paddingHorizontal: 12,
      gap: 2,
    },
    statLabel: { fontSize: 11, lineHeight: 14, fontWeight: '600', color: colors.textMuted },
    statValue: { fontSize: 17, lineHeight: 21, fontWeight: '800', color: colors.text },
    actions: { gap: spacing.sm, marginTop: spacing.xs },
  });
