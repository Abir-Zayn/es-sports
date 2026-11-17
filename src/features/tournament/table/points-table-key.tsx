import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, fontWeight, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = {
  /** What the coloured edge bar means. Hidden when no team qualifies. */
  qualifyNote: string | null;
  /** Shows the "Out" entry when at least one team has been eliminated. */
  showOut: boolean;
};

const ABBREVIATIONS = [
  ['P', 'Played'], ['W', 'Won'], ['L', 'Lost'], ['NR', 'No result'], ['NRR', 'Net run rate'], ['PTS', 'Points'],
] as const;

/** The legend under the points table: what the markers mean and what each column heading stands for. */
export function PointsTableKey({ qualifyNote, showOut }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.wrap}>
      {qualifyNote || showOut ? (
        <View style={styles.markers}>
          {qualifyNote ? (
            <View style={styles.item}>
              <View style={styles.swatch} />
              <Text style={styles.markerText}>{qualifyNote}</Text>
            </View>
          ) : null}
          {showOut ? (
            <View style={styles.item}>
              <Text style={styles.outTag}>OUT</Text>
              <Text style={styles.markerText}>Eliminated by the organiser</Text>
            </View>
          ) : null}
        </View>
      ) : null}
      <Text style={styles.abbr} accessibilityLabel="Columns: played, won, lost, no result, net run rate, points">
        {ABBREVIATIONS.map(([short, long], i) => (
          <Text key={short}>
            <Text style={styles.abbrShort}>{short}</Text>
            {` ${long}${i < ABBREVIATIONS.length - 1 ? '  ·  ' : ''}`}
          </Text>
        ))}
      </Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.sm, paddingHorizontal: sizes.gutter },
    markers: { flexDirection: 'row', flexWrap: 'wrap', columnGap: spacing.lg, rowGap: spacing.sm },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    swatch: { width: dp(12), height: dp(12), borderRadius: radius.pill, backgroundColor: colors.primary },
    markerText: { ...typography.bodyMd, color: colors.text },
    outTag: {
      ...typography.labelSm, fontSize: dp(10), lineHeight: dp(14), color: colors.dangerSoftText, backgroundColor: colors.dangerSoft,
      borderRadius: radius.pill, paddingHorizontal: dp(6), overflow: 'hidden',
    },
    abbr: { ...typography.bodySm, color: colors.textMuted },
    abbrShort: { fontWeight: fontWeight.heading, color: colors.text },
  });
