import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { Performance } from '@/types/profile';

export function PlayerRecentMatches({ matches }: { matches: readonly Performance[] }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}><Text style={styles.heading}>Recent matches</Text>
    {matches.length === 0 ? <Text style={styles.empty}>No recent performances yet.</Text> : matches.map((match) =>
      <View key={match.id} style={styles.row}>
        <View style={styles.marker}><View style={styles.dot} /></View>
        <View style={styles.details}>
          <View style={styles.line}><Text style={styles.opponent}>{match.opponent}</Text><Text style={styles.date}>{match.date}</Text></View>
          <Text style={styles.result}>{match.won ? 'Won' : 'Lost'}</Text>
          <View style={styles.figures}>
            {match.bat ? <Text style={styles.figure}>Batting  {match.bat}</Text> : null}
            {match.bowl ? <Text style={styles.figure}>Bowling  {match.bowl}</Text> : null}
            {!match.bat && !match.bowl ? <Text style={styles.figure}>No individual figures recorded</Text> : null}
          </View>
        </View>
      </View>)}
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: 16 }, heading: { color: c.text, fontWeight: '700', fontSize: 20, lineHeight: 26 },
  empty: { color: c.textMuted, fontSize: 14 }, row: { flexDirection: 'row', gap: 12 },
  marker: { width: 12, alignItems: 'center', paddingTop: 6 }, dot: { width: 9, height: 9, borderRadius: 5, backgroundColor: c.primary },
  details: { flex: 1, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border, paddingBottom: 16, gap: 4 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 }, opponent: { color: c.text, fontWeight: '700', flexShrink: 1 },
  date: { color: c.textMuted, fontSize: 12 }, result: { color: c.textMuted, fontSize: 12 },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, figure: { color: c.text, fontSize: 13 },
});
