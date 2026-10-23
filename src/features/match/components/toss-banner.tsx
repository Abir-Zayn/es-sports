import CircleDollarSign from 'lucide-react-native/icons/circle-dollar-sign';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { team: string; decision: string };

/** Who won the toss and what they chose. */
export function TossBanner({ team, decision }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${team} ${decision}`} style={styles.banner}>
      <CircleDollarSign size={24} color={colors.accent} />
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
      gap: 12,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: colors.accentSoft,
      borderWidth: 1,
      borderColor: colors.accent,
    },
    text: { flex: 1, fontSize: 14, lineHeight: 20 },
    team: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
  });
