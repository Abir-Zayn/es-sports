import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { dp, radius, shadows, typography, useThemedStyles, type Palette } from '@/theme';

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
export function SegmentedControl<T extends string>({ options, selected, onSelect, height = dp(38), accessibilityLabel }: Props<T>) {
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
      gap: dp(4),
      padding: dp(4),
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    segment: { flex: 1, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
    segmentOn: { backgroundColor: colors.surface, ...shadows.iconButton },
    label: { ...typography.labelMd, color: colors.textMuted },
    labelOn: { color: colors.text },
  });
