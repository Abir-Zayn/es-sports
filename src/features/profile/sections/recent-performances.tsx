import { StyleSheet, View } from 'react-native';

import { AppBadge, Section, SectionHeader, Text } from '@/components/ui';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { Performance } from '@/types/profile';

/** The player's last few matches as flat rows: date, bat and bowl figures, and a win or loss badge. */
export function RecentPerformances({ performances }: { performances: Performance[] }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (performances.length === 0) return null;
  return (
    <Section>
      <SectionHeader title="Recent Performances" />
      <View style={styles.list}>
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
                <Text muted style={styles.opponent}>
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
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { paddingHorizontal: sizes.gutter },
    row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: spacing.md },
    divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    date: { width: 56, fontSize: 14, lineHeight: 20, fontWeight: '700' },
    info: { flex: 1, minWidth: 0, gap: 4 },
    figures: { fontSize: 14, lineHeight: 18, fontWeight: '600' },
    opponent: { fontSize: 12, lineHeight: 16 },
  });
