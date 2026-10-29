import Trophy from 'lucide-react-native/icons/trophy';
import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

export type ResultTeamLine = { team: TeamInfo; score: string; overs: string; won: boolean };
export type ResultHighlight = { title: string; name: string; figure: string };

type Props = { headline: string; teams: ResultTeamLine[]; highlights: ResultHighlight[] };

/** The finished match at a glance: who won and by how much, both totals, and the standout players. */
export function MatchResultSummaryCard({ headline, teams, highlights }: Props) {
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  return <View style={s.card}>
    <View style={s.banner} accessibilityRole="header" accessibilityLiveRegion="polite">
      <Trophy size={28} color={colors.primaryText} />
      <Text style={s.headline}>{headline}</Text>
    </View>
    <View style={s.body}>
      {teams.map((line) => <View key={line.team.short} style={s.team}>
        <InitialsAvatar label={line.team.short} tone={line.team.tone} imageUri={line.team.avatarUri} size={36} />
        <Text style={[s.teamName, line.won && s.winner]} numberOfLines={1}>{line.team.name}</Text>
        <Text style={s.score}>{line.score} <Text muted style={s.overs}>({line.overs})</Text></Text>
      </View>)}
      {highlights.length > 0 ? <View style={s.highlights}>
        {highlights.map((h) => <View key={h.title} style={s.highlight} accessible accessibilityLabel={`${h.title}: ${h.name}, ${h.figure}`}>
          <Text muted style={s.title}>{h.title}</Text>
          <Text style={s.name} numberOfLines={1}>{h.name}</Text>
          <Text style={s.figure}>{h.figure}</Text>
        </View>)}
      </View> : null}
    </View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { borderRadius: 24, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: c.primary },
  headline: { flex: 1, color: c.primaryText, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  body: { padding: 14, gap: 12 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  teamName: { flex: 1, fontSize: 15, lineHeight: 20, fontWeight: '600' },
  winner: { fontWeight: '800', color: c.link },
  score: { fontSize: 18, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
  overs: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  highlights: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  highlight: { flexBasis: '30%', flexGrow: 1, padding: 10, gap: 2, borderRadius: 14, backgroundColor: c.surfaceRaised },
  title: { fontSize: 11, lineHeight: 15, letterSpacing: 0.4 },
  name: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
  figure: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: c.link },
});
