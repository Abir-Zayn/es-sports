import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = { searches: readonly string[]; onPick: (search: string) => void; onClear: () => void };

/** What the user searched before. Shown while the search box is empty. */
export function RecentSearches({ searches, onPick, onClear }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>RECENT SEARCHES</Text>
        {searches.length > 0 ? <Pressable accessibilityRole="button" onPress={onClear} style={styles.clear}><Text style={styles.clearText}>Clear history</Text></Pressable> : null}
      </View>
      {searches.length === 0 ? <Text muted>No recent searches yet.</Text> : null}
      <View style={styles.chips}>
        {searches.map((search) => (
          <Pressable key={search} accessibilityRole="button" onPress={() => onPick(search)} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
            <Text style={styles.chipText}>{search}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.md },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
    clear: { minHeight: dp(48), justifyContent: 'center' },
    clearText: { ...typography.labelMd, color: colors.link },
    title: { ...typography.labelUppercase, color: colors.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingVertical: spacing.sm,
      minHeight: dp(48),
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    chipText: { ...typography.labelSm, color: colors.textMuted },
  });
