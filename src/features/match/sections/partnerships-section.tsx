import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import type { Partnership } from '../types';

/** Runs added for each wicket as proportional bars. The stand still in progress is highlighted and starred. */
export function PartnershipsSection({ partnerships }: { partnerships: Partnership[] }) {
  const styles = useThemedStyles(createStyles);
  const max = Math.max(...partnerships.map((p) => p.runs), 1);
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Partnerships
      </Text>
      {partnerships.map((p) => (
        <View
          key={p.wicket}
          accessible
          accessibilityLabel={`${p.wicket} wicket, ${p.pair}, ${p.runs} runs${p.live ? ', not out' : ''}`}
          style={styles.item}
        >
          <View style={styles.row}>
            <Text muted style={styles.pair}>
              <Text style={styles.wicket}>{p.wicket}</Text> · {p.pair}
            </Text>
            <Text style={styles.runs}>
              {p.runs}
              {p.live ? '*' : ''}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, p.live && styles.fillLive, { width: `${Math.round((p.runs / max) * 100)}%` }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: 14 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    item: { gap: 6 },
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    pair: { fontSize: 13, lineHeight: 18 },
    wicket: { fontSize: 13, lineHeight: 18, fontWeight: '600', color: colors.textMuted },
    runs: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
    track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised },
    fill: { height: 6, borderRadius: 3, backgroundColor: colors.primaryDeep },
    fillLive: { backgroundColor: colors.primary },
  });
