import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { onPress: () => void };

/** Entry to comparing two teams, shown with a pair of overlapping team avatars. */
export function HeadToHeadLink({ onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Head to head. Compare any two teams"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.pair}>
        <InitialsAvatar label="CS" tone="blue" size={36} borderColor={colors.primarySoft} borderWidth={2} />
        <View style={styles.overlap}>
          <InitialsAvatar label="KK" tone="yellow" size={36} borderColor={colors.primarySoft} borderWidth={2} />
        </View>
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>Head to head</Text>
        <Text style={styles.subtitle}>Compare any two teams</Text>
      </View>
      <ChevronRight size={20} color={colors.link} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      padding: spacing.lg,
      borderRadius: 20,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    pair: { flexDirection: 'row' },
    overlap: { marginLeft: -10 },
    text: { flex: 1, gap: 2 },
    title: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    subtitle: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  });
