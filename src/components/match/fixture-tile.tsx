import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Text } from '@/components/ui';
import { dateParts } from '@/lib/date-parts';
import { dp, radius, spacing, sp, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { Fixture, FixtureSide } from '@/types/cricket';

type Props = { fixture: Fixture; onPress?: () => void; showBadge?: boolean; badgeLabel?: string };

/** "176/6" and "20" become "176/6(20)". A side that has not batted shows nothing. */
const scoreText = ({ score, overs }: FixtureSide) => (score ? `${score}${overs ? `(${overs})` : ''}` : '');

/**
 * A match as a flat horizontal bar: date circle, "vs", the two team names stacked (the first larger, no
 * logos), then the start time. A match that has begun adds both scores beside the time, split by a thin
 * divider, and a line under the teams: who won, or what the chase needs. A live match also carries a LIVE
 * badge beside the first team. The horizontal dividing bar spans the full width of the tile with padding on both ends.
 * It has no card of its own, so stack several for a list.
 */
export function FixtureTile({ fixture, onPress, showBadge = false, badgeLabel }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { day, weekday } = dateParts(fixture.date);
  const [one, two] = fixture.sides;
  const live = fixture.state === 'live';
  const played = fixture.state !== 'upcoming';
  const isResult = fixture.state === 'result';
  const spoken = (side: FixtureSide) => `${side.team.name}${side.score ? ` ${scoreText(side)}` : ''}`;
  const when = live ? ', live' : fixture.time ? `, ${fixture.time}` : '';

  const tileBadge = live ? (
    <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} />
  ) : showBadge ? (
    isResult ? (
      <AppBadge
        label={badgeLabel ?? 'Completed'}
        backgroundColor={colors.successSoft}
        color={colors.success}
      />
    ) : (
      <AppBadge
        label={badgeLabel ?? 'Upcoming'}
        backgroundColor={colors.surfaceRaised}
        color={colors.textMuted}
      />
    )
  ) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${fixture.title}, ${fixture.day}${when}. ${played ? `${spoken(one)}, ${spoken(two)}` : `${one.team.name} versus ${two.team.name}`}. ${fixture.note}`}
      onPress={onPress}
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
    >
      <View style={styles.circle}>
        <Text style={styles.day}>{day}</Text>
        <Text style={styles.weekday}>{weekday}</Text>
      </View>
      <View style={styles.body}>
        {/* Beside the whole block, so it stays level with the date circle when a result line is shown. */}
        <Text style={styles.versus}>vs</Text>
        <View style={styles.main}>
          <View style={styles.line}>
            <View style={styles.column}>
              <View style={styles.nameLine}>
                <Text style={[styles.first, styles.shrink]} numberOfLines={1}>
                  {one.team.name}
                </Text>
                {tileBadge}
              </View>
              <Text style={styles.second} numberOfLines={1}>
                {two.team.name}
              </Text>
            </View>
            {played ? (
              <View style={styles.scores}>
                <Text style={[styles.first, styles.figure, !one.emphasised && styles.dim]}>{scoreText(one)}</Text>
                <Text style={[styles.second, styles.figure, !two.emphasised && styles.dim]}>{scoreText(two)}</Text>
              </View>
            ) : null}
            {played && fixture.time ? <View style={styles.rule} /> : null}
            {fixture.time ? <Text style={styles.time}>{fixture.time}</Text> : null}
          </View>
          {played && fixture.note ? <Text style={styles.result}>{fixture.note}</Text> : null}
        </View>
      </View>
    </Pressable>
  );
}

const CIRCLE = dp(36);

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    bar: {
      width: '100%',
      minHeight: dp(64),
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    circle: {
      width: CIRCLE,
      height: CIRCLE,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      alignItems: 'center',
      justifyContent: 'center',
    },
    day: { ...typography.labelMd, fontSize: sp(13), color: colors.text, fontVariant: ['tabular-nums'] },
    weekday: { ...typography.labelUppercase, fontSize: sp(8), lineHeight: sp(10), letterSpacing: sp(0.3), color: colors.textMuted },
    body: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginLeft: spacing.sm,
    },
    main: { flex: 1, minWidth: 0, gap: spacing.xs },
    line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    // The line box hugs the glyphs (no Android font padding), and a lowercase word with no ascenders sits low
    // in it, so a small bottom pad lifts "vs" to the optical middle of the block beside it.
    versus: {
      ...typography.labelSm,
      width: dp(18),
      lineHeight: sp(12),
      paddingBottom: dp(2),
      color: colors.textMuted,
      includeFontPadding: false,
      textAlignVertical: 'center',
    },
    column: { flex: 1, minWidth: 0, gap: dp(1) },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    shrink: { flexShrink: 1 },
    first: { ...typography.labelMd, lineHeight: sp(18), fontWeight: typography.headlineMd.fontWeight, color: colors.text },
    second: { ...typography.bodySm, color: colors.text },
    scores: { gap: dp(1), alignItems: 'flex-end' },
    figure: { fontVariant: ['tabular-nums'] },
    dim: { color: colors.textMuted },
    rule: { alignSelf: 'stretch', width: 1, marginVertical: dp(2), backgroundColor: colors.border },
    time: { ...typography.bodySm, color: colors.text, textAlign: 'right', fontVariant: ['tabular-nums'] },
    result: { ...typography.bodySm, paddingTop: spacing.xs, color: colors.link },
  });
