import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { MatchInfoData } from '../types';

/** Buttons to the match's streams on each platform. */
export function WatchLiveSection({ streams }: { streams: MatchInfoData['streams'] }) {
  const { colors } = useTheme();
  const toneColors = useToneColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Watch live
      </Text>
      <View style={styles.row}>
        {streams.map((stream) => (
          <Pressable
            key={stream.id}
            accessibilityRole="link"
            accessibilityLabel={`Watch on ${stream.label}`}
            onPress={() => comingSoon(stream.label)}
            style={({ pressed }) => [styles.button, pressed && styles.pressed]}
          >
            <View
              style={[styles.dot, { backgroundColor: stream.tone === 'red' ? colors.live : toneColors('blue').fill }]}
            />
            <Text style={styles.label}>{stream.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: typography.headlineLg,
    row: { flexDirection: 'row', gap: spacing.md },
    button: {
      flex: 1,
      minHeight: sizes.control,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    dot: { width: dp(10), height: dp(10), borderRadius: radius.pill },
    label: { ...typography.labelMd, color: colors.text },
  });
