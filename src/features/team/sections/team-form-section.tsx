import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

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
        <Pressable accessibilityRole="link" hitSlop={12} onPress={onAllMatches}>
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
    section: { gap: 12 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    link: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.link },
    row: { flexDirection: 'row', gap: 8 },
    tile: {
      flex: 1,
      minWidth: 0,
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 4,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badge: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
    win: { backgroundColor: colors.primary },
    loss: { backgroundColor: colors.dangerSoft },
    badgeText: { fontSize: 13, lineHeight: 18, fontWeight: '800' },
    winText: { color: colors.primaryText },
    lossText: { color: colors.dangerSoftText },
    versus: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
    match: { fontSize: 10, lineHeight: 12 },
  });
