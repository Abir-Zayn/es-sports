import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { useThemedStyles, type Palette } from '@/theme';

export type SegmentedOption<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  options: SegmentedOption<T>[];
  selected: T;
  onSelect: (id: T) => void;
  /** Height of each segment. */
  height?: number;
  accessibilityLabel?: string;
};

/** A boxed switch where equal-width segments share one row and the selected one is filled. */
export function SegmentedControl<T extends string>({ options, selected, onSelect, height = 38, accessibilityLabel }: Props<T>) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityRole="tablist" accessibilityLabel={accessibilityLabel} style={styles.box}>
      {options.map((option) => {
        const on = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onSelect(option.id)}
            style={[styles.segment, { height }, on && styles.segmentOn]}
          >
            <Text style={[styles.label, on && styles.labelOn]}>{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    box: {
      flexDirection: 'row',
      gap: 4,
      padding: 4,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segment: { flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    segmentOn: { backgroundColor: colors.primary },
    label: { fontSize: 13, lineHeight: 18, fontWeight: '700', color: colors.textMuted },
    labelOn: { color: colors.primaryText },
  });
