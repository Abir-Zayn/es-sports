import { StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Rect } from 'react-native-svg';

import { Text } from '@/components/ui';
import { leagueTable } from '@/features/tournament/sample-table';
import { useThemedStyles, type Palette } from '@/theme';

import { oversLabel } from '../engine/score-delivery';
import type { ScoreState } from '../types';
import { chaseLabel } from './score-summary';

export type OverlayGraphic = 'Lineup' | 'Player card' | 'Over summary' | 'Points table';
export function OverlayPreview({ score, graphic, accent }: { score: ScoreState; graphic: OverlayGraphic | null; accent: string }) {
  const s = useThemedStyles(styles);
  const striker = score.batters[score.strikerId];
  const nonStriker = score.batters[score.nonStrikerId];
  const bowler = score.bowlers[score.bowlerId];
  return <View style={s.preview} accessibilityLabel="Local stream overlay preview">
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" viewBox="0 0 352 220" preserveAspectRatio="none">
      <Rect width={352} height={220} fill="#20382A" />
      <Ellipse cx={176} cy={254} rx={255} ry={165} fill="#2B5038" />
      <Rect x={166} y={78} width={20} height={116} fill="#C9B98A" opacity={0.3} />
    </Svg>
    {graphic ? <View style={s.graphic} accessibilityLiveRegion="polite">
      <Text style={s.graphicTitle}>{graphic}</Text>
      {graphic === 'Lineup' ? <Text style={s.graphicBody}>{Object.values(score.batters).map((p) => p.name).join(' · ')}</Text> :
        graphic === 'Player card' ? <><Text style={s.player}>{striker.name}</Text><Text style={s.graphicBody}>{striker.runs} runs · {striker.balls} balls</Text></> :
        graphic === 'Over summary' ? <Text style={s.graphicBody}>{score.lastOver
          ? `Over ${score.lastOver.number} · ${score.lastOver.runs} runs\n${score.lastOver.deliveries.map((d) => d.label).join('   ')}`
          : `This over · ${score.currentOver.reduce((sum, d) => sum + d.total, 0)} runs\n${score.currentOver.map((d) => d.label).join('   ') || 'No deliveries yet'}`}</Text> :
          <Text style={s.graphicBody}>Sample standings{leagueTable.rows.slice(0, 4).map((r) => `\n${r.pos}. ${r.team.short} · ${r.points} pts`).join('')}</Text>}
    </View> : <Text style={s.camera}>YOUR CAMERA FEED</Text>}
    <View style={s.scorebug}>
      <View style={[s.brand, { backgroundColor: accent }]}><Text style={s.brandText}>ES</Text></View>
      <View style={s.team}><Text style={s.small}>{score.battingTeam}</Text><Text style={s.score}>{score.runs}/{score.wickets}</Text><Text style={s.small}>{oversLabel(score.balls)}</Text></View>
      <View style={s.batters}><Text style={s.small}>{striker.name.split(' ')[0]} {striker.runs}* ({striker.balls})</Text><Text style={s.small}>{nonStriker.name.split(' ')[0]} {nonStriker.runs} ({nonStriker.balls})</Text></View>
      <View style={s.bowler}><Text style={s.small}>{bowler.name.split(' ')[0]} {bowler.wickets}–{bowler.runs}</Text><Text style={[s.small, { color: accent }]}>{chaseLabel(score)}</Text></View>
    </View>
  </View>;
}
const styles = (_c: Palette) => StyleSheet.create({
  preview: { width: '100%', aspectRatio: 1.65, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  camera: { color: '#9AA6A1', opacity: 0.65, fontSize: 10, lineHeight: 14, fontWeight: '600', letterSpacing: 0.8, position: 'absolute', top: 38 },
  graphic: { marginHorizontal: 16, marginBottom: 38, padding: 12, borderRadius: 12, backgroundColor: '#0A0E0DEB', alignSelf: 'stretch', gap: 6 },
  graphicTitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 18, fontWeight: '700' },
  graphicBody: { color: '#F2F5F3', fontSize: 10, lineHeight: 15 }, player: { color: '#FFFFFF', fontSize: 20, lineHeight: 26, fontWeight: '800' },
  scorebug: { position: 'absolute', bottom: 9, left: 8, right: 8, borderRadius: 8, minHeight: 36, backgroundColor: '#0A0E0D', overflow: 'hidden', flexDirection: 'row', alignItems: 'stretch' },
  brand: { paddingHorizontal: 6, alignItems: 'center', justifyContent: 'center' }, brandText: { color: '#04121A', fontSize: 10, lineHeight: 14, fontWeight: '800', letterSpacing: 0.6 },
  team: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 6 },
  small: { color: '#F2F5F3', fontSize: 8, lineHeight: 12 }, score: { color: '#FFFFFF', fontSize: 13, lineHeight: 17, fontWeight: '800' },
  batters: { flex: 1, borderLeftWidth: 1, borderColor: '#222B28', padding: 4, justifyContent: 'center' },
  bowler: { flex: 1, borderLeftWidth: 1, borderColor: '#222B28', padding: 4, justifyContent: 'center' },
});
