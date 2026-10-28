import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { chunk } from '@/lib/chunk';
import { radius, sizes, spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { SquadPlayer } from '../types';
import { TopXiIndicatorPill } from './top-xi-indicator-pill';
import { TopXiPlayerDisc } from './top-xi-player-disc';

const COLUMNS = 3;

type Props = {
  players: SquadPlayer[];
  tone: AvatarTone;
  onPlayerPress: (player: SquadPlayer) => void;
  onEditPlayingXi: () => void;
  onToggleBench: () => void;
  benchCount: number;
};

/**
 * Top XI Showcase Card with an 11-slot indicator pill,
 * 3-column grid of circular player discs, and clean lineup controls.
 */
export function TopXiCard({
  players,
  tone,
  onPlayerPress,
  onEditPlayingXi,
  onToggleBench,
  benchCount,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const rows = chunk(players, COLUMNS);

  return (
    <View style={styles.card}>
      {/* Top header with 11-dot indicator pill */}
      <View style={styles.header}>
        <TopXiIndicatorPill activeCount={players.length} label="Top XI Lineup" />
      </View>

      {/* Circular Disc Grid (3x3 + 2 centered) */}
      <View style={styles.grid}>
        {rows.map((row, rowIndex) => {
          const isLastRow = rowIndex === rows.length - 1 && row.length < COLUMNS;
          return (
            <View
              key={`row-${rowIndex}`}
              style={[styles.row, isLastRow && styles.rowCentered]}
            >
              {row.map((player) => (
                <TopXiPlayerDisc
                  key={player.name}
                  player={player}
                  tone={tone}
                  onPress={onPlayerPress}
                />
              ))}
            </View>
          );
        })}
      </View>

      {/* Action Button & Bench Link */}
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Edit Playing XI"
          onPress={onEditPlayingXi}
          style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
        >
          <Text style={styles.actionButtonText}>Edit Playing XI</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`View bench players, ${benchCount} on bench`}
          onPress={onToggleBench}
          style={styles.benchLink}
        >
          <Text style={styles.benchLinkText}>
            View Bench ({benchCount} Players)
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceRaised,
      borderRadius: radius.lg + 4,
      borderWidth: 1.5,
      borderColor: colors.border,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.sm,
      gap: spacing.lg,
      position: 'relative',
      overflow: 'hidden',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    header: {
      alignItems: 'center',
      paddingTop: 4,
    },
    grid: {
      gap: spacing.md,
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
    },
    rowCentered: {
      justifyContent: 'center',
      gap: spacing.lg,
    },
    footer: {
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.xs,
      paddingHorizontal: sizes.gutter,
    },
    actionButton: {
      width: '100%',
      maxWidth: 280,
      height: 48,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.outline,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 3,
    },
    actionButtonPressed: {
      backgroundColor: colors.surfaceRaised,
      transform: [{ scale: 0.98 }],
    },
    actionButtonText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '700',
      color: colors.text,
    },
    benchLink: {
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    benchLinkText: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.link,
      textDecorationLine: 'underline',
    },
  });
