import CircleDollarSign from 'lucide-react-native/icons/circle-dollar-sign';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { team: string; decision: string };

/** Who won the toss and what they chose. */
export function TossBanner({ team, decision }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${team} ${decision}`} style={styles.banner}>
      <CircleDollarSign size={sizes.icon} color={colors.accent} />
      <Text style={styles.text}>
        <Text style={styles.team}>{team}</Text> {decision}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
    },
    text: { ...typography.bodyMd, flex: 1 },
    team: typography.headlineMd,
  });
