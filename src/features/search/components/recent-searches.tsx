import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

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
          <Pressable key={search} accessibilityRole="button" onPress={() => onPick(search)} style={styles.chip}>
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
    clear: { minHeight: 48, justifyContent: 'center' },
    clearText: { color: colors.link, fontSize: 13, fontWeight: '600' },
    title: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5, color: colors.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingVertical: spacing.sm,
      minHeight: 48,
      justifyContent: 'center',
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: { fontSize: 13, lineHeight: 18 },
  });
