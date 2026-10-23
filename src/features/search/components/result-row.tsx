import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { SearchRow } from '../sample-data';

type Props = { row: SearchRow; onPress?: () => void };

/** One search hit: avatar, name, details, and a chevron. */
export function ResultRow({ row, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const plain = row.tone === 'neutral';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${row.name}, ${row.meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <InitialsAvatar
        label={row.short}
        tone={row.tone}
        shape={row.shape}
        size={44}
        borderColor={plain ? colors.outline : undefined}
        borderWidth={plain ? 1.5 : 0}
      />
      <View style={styles.text}>
        <Text style={styles.name}>{row.name}</Text>
        <Text style={styles.meta}>{row.meta}</Text>
      </View>
      <ChevronRight size={18} color={colors.outline} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: 10,
      paddingHorizontal: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: { opacity: 0.7 },
    text: { flex: 1, minWidth: 0, gap: 3 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
    meta: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  });
