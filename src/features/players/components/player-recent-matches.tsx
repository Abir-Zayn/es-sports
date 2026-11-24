import { StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';
import type { Performance } from '@/types/profile';

export function PlayerRecentMatches({ matches }: { matches: readonly Performance[] }) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  return <View style={styles.section}><Text style={styles.heading}>{t('players.recentMatchesTitle')}</Text>
    {matches.length === 0 ? <Text style={styles.empty}>{t('players.recentEmpty')}</Text> : matches.map((match) =>
      <View key={match.id} style={styles.row}>
        <View style={styles.marker}><View style={styles.dot} /></View>
        <View style={styles.details}>
          <View style={styles.line}><Text style={styles.opponent}>{match.opponent}</Text><Text style={styles.date}>{match.date}</Text></View>
          <View style={styles.figures}>
            {match.bat ? <Text style={styles.figure}>{t('players.battingPrefix', { value: match.bat })}</Text> : null}
            {match.bowl ? <Text style={styles.figure}>{t('players.bowlingPrefix', { value: match.bowl })}</Text> : null}
            {!match.bat && !match.bowl ? <Text style={styles.figure}>{t('players.noFigures')}</Text> : null}
          </View>
        </View>
      </View>)}
  </View>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  section: { gap: spacing.lg }, heading: { ...typography.headlineMd, color: c.text },
  empty: { ...typography.bodyMd, color: c.textMuted }, row: { flexDirection: 'row', gap: spacing.md },
  marker: { width: dp(12), alignItems: 'center', paddingTop: dp(6) }, dot: { width: dp(9), height: dp(9), borderRadius: radius.pill, backgroundColor: c.outline },
  details: { flex: 1, borderBottomWidth: 1, borderColor: c.border, paddingBottom: spacing.lg, gap: spacing.xs },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }, opponent: { ...typography.labelMd, color: c.text, flexShrink: 1 },
  date: { ...typography.bodySm, color: c.textMuted },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }, figure: { ...typography.bodySm, color: c.text, fontVariant: ['tabular-nums'] },
});
