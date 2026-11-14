import { StyleSheet, View } from 'react-native';

import { AppBadge, Card, Section, SectionHeader, Text } from '@/components/ui';
import { dp, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { Performance } from '@/types/profile';

/** The player's last few matches as flat rows: date, bat and bowl figures, and a win or loss badge. */
export function RecentPerformances({ performances }: { performances: Performance[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (performances.length === 0) return null;
  return (
    <Section>
      <SectionHeader title="Recent Performances" />
      <Card padding="none" style={styles.list}>
        {performances.map((p, i) => {
          const figures = [p.bat && `Bat ${p.bat}`, p.bowl && `Bowl ${p.bowl}`].filter(Boolean).join('  ·  ');
          return (
            <View
              key={p.id}
              accessible
              accessibilityLabel={`${p.date}, ${p.opponent}. ${figures}. ${p.won ? 'Won' : 'Lost'}`}
              style={[styles.row, i < performances.length - 1 && styles.divider]}
            >
              <Text style={styles.date}>{p.date}</Text>
              <View style={styles.info}>
                <Text style={styles.figures}>{figures}</Text>
                <Text variant="bodySm" muted>
                  {p.opponent}
                </Text>
              </View>
              <AppBadge
                label={p.won ? 'WON' : 'LOST'}
                backgroundColor={p.won ? colors.primarySoft : colors.dangerSoft}
                color={p.won ? colors.link : colors.dangerSoftText}
              />
            </View>
          );
        })}
      </Card>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { marginHorizontal: sizes.gutter, paddingHorizontal: sizes.cardPaddingTight },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    date: { ...typography.labelMd, width: dp(56), fontVariant: ['tabular-nums'] },
    info: { flex: 1, minWidth: 0, gap: spacing.xs },
    figures: { ...typography.bodyMd, fontVariant: ['tabular-nums'] },
  });
