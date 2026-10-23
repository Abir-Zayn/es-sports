import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

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
    section: { gap: 10 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    row: { flexDirection: 'row', gap: 10 },
    button: {
      flex: 1,
      height: 52,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    label: { fontSize: 14, lineHeight: 19, fontWeight: '600' },
  });
