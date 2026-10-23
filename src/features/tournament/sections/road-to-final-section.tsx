import Trophy from 'lucide-react-native/icons/trophy';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { PointsTableData, SemiFinal } from '@/types/cricket';

import { BracketConnector } from '../components/bracket-connector';

type Props = { semis: SemiFinal[]; final: PointsTableData['final'] };

/** The knockout bracket: two semi-finals feeding the final. */
export function RoadToFinalSection({ semis, final }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Road to the final
      </Text>
      <View style={styles.bracket}>
        <View style={styles.semis}>
          {semis.map((semi) => (
            <View key={semi.id} style={styles.semi}>
              <Text style={styles.semiLabel}>{semi.label}</Text>
              {semi.sides.map((side) => (
                <View key={side.seed} style={styles.side}>
                  <InitialsAvatar label={side.seed} tone={side.tone} size={22} />
                  <Text style={styles.sideName} numberOfLines={1}>
                    {side.name}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
        <BracketConnector />
        <View style={styles.final}>
          <Trophy size={30} color={colors.link} />
          <Text style={styles.finalTitle}>FINAL</Text>
          <Text style={styles.finalDate}>{final.date}</Text>
          <Text style={styles.finalCaption}>{final.caption}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    bracket: { flexDirection: 'row', alignItems: 'center' },
    semis: { flex: 1, minWidth: 0, gap: spacing.md },
    semi: {
      padding: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
    },
    semiLabel: { fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 1, color: colors.textMuted },
    side: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sideName: { flex: 1, fontSize: 13, lineHeight: 18, fontWeight: '600' },
    final: {
      flex: 1,
      minWidth: 0,
      paddingVertical: 14,
      paddingHorizontal: spacing.md,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      gap: spacing.sm,
    },
    finalTitle: { fontSize: 22, lineHeight: 26, fontWeight: '800', letterSpacing: 1 },
    finalDate: { fontSize: 12, lineHeight: 16, textAlign: 'center', color: colors.text },
    finalCaption: { fontSize: 11, lineHeight: 15, textAlign: 'center', color: colors.textMuted },
  });
