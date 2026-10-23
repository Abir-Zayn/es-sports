import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

type Props = { searches: string[]; onPick: (search: string) => void };

/** What the user searched before. Shown while the search box is empty. */
export function RecentSearches({ searches, onPick }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      <Text accessibilityRole="header" style={styles.title}>
        RECENT SEARCHES
      </Text>
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
    title: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5, color: colors.textMuted },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: 14,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: { fontSize: 13, lineHeight: 18 },
  });
