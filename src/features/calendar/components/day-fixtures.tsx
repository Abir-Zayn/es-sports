import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { dp, radius, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { formatStart, type CalendarFixture } from '../calendar-repository';

type Props = { fixtures: CalendarFixture[]; onOpen: (fixture: CalendarFixture) => void };

/** The chosen day's games: time, the two sides and the tournament. Each opens its match or tournament. */
export function DayFixtures({ fixtures, onOpen }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  if (fixtures.length === 0) {
    return <Text muted style={styles.empty} accessibilityLiveRegion="polite">No games on this day.</Text>;
  }
  return (
    <View style={styles.list}>
      {fixtures.map((f) => (
        <Pressable
          key={f.id}
          accessibilityRole="button"
          accessibilityLabel={`${formatStart(f.startMin)}, ${f.home} versus ${f.away}, ${f.tournamentName}${f.cancelled ? ', cancelled' : ''}`}
          onPress={() => onOpen(f)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Text style={styles.time}>{formatStart(f.startMin)}</Text>
          <View style={styles.info}>
            <Text style={[styles.teams, f.cancelled && styles.struck]} numberOfLines={2}>{`${f.home} vs ${f.away}`}</Text>
            <Text variant="caption" muted numberOfLines={1}>{`${f.tournamentName} · ${f.stage}`}</Text>
          </View>
          {f.cancelled ? (
            <AppBadge label="CANCELLED" backgroundColor={colors.dangerSoft} color={colors.dangerSoftText} />
          ) : (
            <ChevronRight size={dp(18)} color={colors.textMuted} />
          )}
        </Pressable>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    list: { gap: spacing.sm },
    empty: { ...typography.bodyMd, textAlign: 'center', paddingVertical: spacing.xl },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg,
      borderRadius: radius.lg, backgroundColor: colors.surface,
    },
    pressed: { backgroundColor: colors.surfaceRaised },
    time: { ...typography.labelMd, width: dp(72), fontVariant: ['tabular-nums'] },
    info: { flex: 1, minWidth: 0, gap: spacing.xs },
    teams: typography.bodyMd,
    struck: { textDecorationLine: 'line-through', color: colors.textMuted },
  });
