import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { InitialsAvatar, Text } from '@/components/ui';
import { sizes, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

const AMBER_PILL = '#E08214';
const ON_AMBER = '#0A0E0D';

export type ResultTeamLine = { team: TeamInfo; score: string; overs: string; won: boolean };
export type ResultHighlight = { title: string; name: string; figure: string };

type Props = { headline: string; teams: ResultTeamLine[]; highlights: ResultHighlight[] };

const shortTag = (title: string) =>
  title.includes('MVP') || title.includes('PLAYER') ? 'MVP' : title.includes('BAT') ? 'BAT' : 'BOWL';

/** The finished match at a glance in DAZN hero style: responsive rounded gradient header, central scoreboard, and highlight rows. */
export function MatchResultSummaryCard({ headline, teams, highlights }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
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
            <View style={s.teamCol} accessible accessibilityLabel={`${first.team.name}, ${first.score}, ${first.overs} overs`}>
              <InitialsAvatar
                label={first.team.short}
                tone={first.team.tone}
                imageUri={first.team.avatarUri}
                size={52}
                borderColor={first.won ? colors.accent : colors.border}
                borderWidth={first.won ? 2 : 1}
              />
              <Text style={[s.teamName, first.won && s.winner]} numberOfLines={2}>
                {first.team.name}
              </Text>
            </View>

            <View style={s.centerCol}>
              <Text muted style={s.oversLine}>
                {first.overs} ov · {second.overs} ov
              </Text>
              <View style={s.scoreRow}>
                <Text style={[s.scoreBig, !first.won && second.won && s.scoreDim]}>{first.score}</Text>
                <Text style={s.scoreDash}>–</Text>
                <Text style={[s.scoreBig, !second.won && first.won && s.scoreDim]}>{second.score}</Text>
              </View>
              <Text muted style={s.statusTag}>FT</Text>
            </View>

            <View style={s.teamCol} accessible accessibilityLabel={`${second.team.name}, ${second.score}, ${second.overs} overs`}>
              <InitialsAvatar
                label={second.team.short}
                tone={second.team.tone}
                imageUri={second.team.avatarUri}
                size={52}
                borderColor={second.won ? colors.accent : colors.border}
                borderWidth={second.won ? 2 : 1}
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
                <Text muted style={s.roleText}>{shortTag(h.title)}</Text>
                <View style={s.amberPill}>
                  <Text style={s.amberFigure}>{h.figure}</Text>
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
      paddingVertical: 14,
      paddingHorizontal: sizes.gutter,
      gap: 14,
    },
    scoreboard: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
    teamCol: { width: 96, alignItems: 'center', gap: 10 },
    teamName: { fontSize: 14, lineHeight: 18, fontWeight: '700', textAlign: 'center', color: c.text },
    winner: { color: c.text, fontWeight: '800' },
    centerCol: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 2, gap: 4 },
    oversLine: { fontSize: 12, lineHeight: 16, fontVariant: ['tabular-nums'] },
    scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    scoreBig: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: c.text, fontVariant: ['tabular-nums'] },
    scoreDim: { color: c.textMuted },
    scoreDash: { fontSize: 24, lineHeight: 30, fontWeight: '700', color: c.textMuted },
    statusTag: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.8 },
    summaryBlock: { alignItems: 'center' },
    headline: { fontSize: 14, lineHeight: 19, fontWeight: '700', color: c.textMuted, textAlign: 'center' },
    highlights: { gap: 8, paddingTop: 2 },
    highlightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    playerName: { width: 132, textAlign: 'right', fontSize: 13, lineHeight: 18, fontWeight: '500', color: c.textMuted },
    roleText: { fontSize: 11, lineHeight: 14, fontWeight: '700', letterSpacing: 0.5 },
    amberPill: { minWidth: 64, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5, backgroundColor: AMBER_PILL, alignItems: 'center' },
    amberFigure: { fontSize: 11, lineHeight: 15, fontWeight: '800', color: ON_AMBER, fontVariant: ['tabular-nums'] },
  });
