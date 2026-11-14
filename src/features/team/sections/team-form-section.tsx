import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { FormResult } from '../types';

type Props = { form: FormResult[]; onAllMatches: () => void };

/** The last results as small tiles: a W or L, the opponent and the match number. */
export function TeamFormSection({ form, onAllMatches }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Form
        </Text>
        <Pressable accessibilityRole="link" hitSlop={sizes.hitSlop} onPress={onAllMatches}>
          <Text style={styles.link}>All matches</Text>
        </Pressable>
      </View>
      <View style={styles.row}>
        {form.map((result) => (
          <View
            key={result.id}
            accessible
            accessibilityLabel={`${result.won ? 'Won' : 'Lost'} ${result.versus}, ${result.match}`}
            style={styles.tile}
          >
            <View style={[styles.badge, result.won ? styles.win : styles.loss]}>
              <Text style={[styles.badgeText, result.won ? styles.winText : styles.lossText]}>{result.won ? 'W' : 'L'}</Text>
            </View>
            <Text style={styles.versus}>{result.versus}</Text>
            <Text muted style={styles.match}>
              {result.match}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: typography.headlineLg,
    link: { ...typography.labelMd, color: colors.link },
    row: { flexDirection: 'row', gap: spacing.sm },
    tile: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    badge: { width: dp(30), height: dp(30), borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    win: { backgroundColor: colors.primarySoft },
    loss: { backgroundColor: colors.dangerSoft },
    badgeText: typography.labelMd,
    winText: { color: colors.link },
    lossText: { color: colors.dangerSoftText },
    versus: typography.labelSm,
    match: typography.tabLabel,
  });
