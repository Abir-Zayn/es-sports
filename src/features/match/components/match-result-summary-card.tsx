import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

export type ResultTeamLine = { team: TeamInfo; score: string; overs: string; won: boolean };
export type ResultHighlight = { title: string; tag?: 'MVP' | 'BAT' | 'BOWL'; name: string; figure: string };

type Props = { headline: string; teams: ResultTeamLine[]; highlights: ResultHighlight[] };

const shortTag = (h: ResultHighlight) =>
  h.tag ?? (h.title.includes('MVP') || h.title.includes('PLAYER') ? 'MVP' : h.title.includes('BAT') ? 'BAT' : 'BOWL');

/** The finished match at a glance in DAZN hero style: responsive rounded gradient header, central scoreboard, and highlight rows. */
export function MatchResultSummaryCard({ headline, teams, highlights }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [first, second] = teams;

  return (
    <View style={s.hero}>
      <Svg
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      >
        <Defs>
          <LinearGradient id="matchSummaryHeroGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor={colors.primarySoft} stopOpacity="1" />
            <Stop offset="55%" stopColor={colors.surfaceRaised} stopOpacity="0.95" />
            <Stop offset="100%" stopColor={colors.background} stopOpacity="0.95" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#matchSummaryHeroGrad)" />
      </Svg>

      <View style={s.inner}>
        {first && second ? (
          <View style={s.scoreboard}>
            <View style={s.teamCol} accessible accessibilityLabel={`${first.team.name}, ${first.score}, ${t('match.hero.oversA11y', { count: first.overs })}`}>
              <InitialsAvatar
                label={first.team.short}
                tone={first.team.tone}
                imageUri={first.team.avatarUri}
                size={dp(52)}
                borderColor={first.won ? colors.primary : 'transparent'}
                borderWidth={2}
              />
              <Text style={[s.teamName, first.won && s.winner]} numberOfLines={2}>
                {first.team.name}
              </Text>
            </View>

            <View style={s.centerCol}>
              <Text muted style={s.oversLine}>
                {t('match.ovShort', { overs: first.overs })} · {t('match.ovShort', { overs: second.overs })}
              </Text>
              <View style={s.scoreRow}>
                <Text style={[s.scoreBig, !first.won && second.won && s.scoreDim]}>{first.score}</Text>
                <Text style={s.scoreDash}>–</Text>
                <Text style={[s.scoreBig, !second.won && first.won && s.scoreDim]}>{second.score}</Text>
              </View>
              <Text muted style={s.statusTag}>FT</Text>
            </View>

            <View style={s.teamCol} accessible accessibilityLabel={`${second.team.name}, ${second.score}, ${t('match.hero.oversA11y', { count: second.overs })}`}>
              <InitialsAvatar
                label={second.team.short}
                tone={second.team.tone}
                imageUri={second.team.avatarUri}
                size={dp(52)}
                borderColor={second.won ? colors.primary : 'transparent'}
                borderWidth={2}
              />
              <Text style={[s.teamName, second.won && s.winner]} numberOfLines={2}>
                {second.team.name}
              </Text>
            </View>
          </View>
        ) : null}

        <View style={s.summaryBlock} accessibilityRole="header" accessibilityLiveRegion="polite">
          <Text style={s.headline}>{headline}</Text>
        </View>

        {highlights.length > 0 ? (
          <View style={s.highlights}>
            {highlights.map((h) => (
              <View
                key={h.title}
                style={s.highlightRow}
                accessible
                accessibilityLabel={`${h.title}: ${h.name}, ${h.figure}`}
              >
                <Text style={s.playerName} numberOfLines={1}>
                  {h.name}
                </Text>
                <Text muted style={s.roleText}>{shortTag(h)}</Text>
                <View style={s.figurePill}>
                  <Text style={s.figure}>{h.figure}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = (c: Palette) =>
  StyleSheet.create({
    hero: {
      width: '100%',
      overflow: 'hidden',
      position: 'relative',
    },
    inner: {
      paddingVertical: spacing.lg,
      paddingHorizontal: sizes.gutter,
      gap: spacing.lg,
    },
    scoreboard: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    teamCol: { width: dp(96), alignItems: 'center', gap: spacing.sm },
    teamName: { ...typography.labelMd, textAlign: 'center', color: c.text },
    winner: { ...typography.headlineMd, color: c.text },
    centerCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: dp(2), gap: spacing.xs },
    oversLine: { ...typography.bodySm, fontVariant: ['tabular-nums'] },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    scoreBig: { ...typography.numeralStat, color: c.text },
    scoreDim: { color: c.textMuted },
    scoreDash: { ...typography.displayMd, color: c.textMuted },
    statusTag: typography.labelUppercase,
    summaryBlock: { alignItems: 'center' },
    headline: { ...typography.headlineMd, color: c.textMuted, textAlign: 'center' },
    highlights: { gap: spacing.sm, paddingTop: dp(2) },
    highlightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    playerName: { ...typography.bodySm, width: dp(132), textAlign: 'right', color: c.textMuted },
    roleText: typography.labelSm,
    figurePill: { minWidth: dp(64), paddingHorizontal: spacing.sm, paddingVertical: dp(3), borderRadius: radius.pill, backgroundColor: c.surfaceRaised, alignItems: 'center' },
    figure: { ...typography.labelSm, color: c.text, fontVariant: ['tabular-nums'] },
  });
