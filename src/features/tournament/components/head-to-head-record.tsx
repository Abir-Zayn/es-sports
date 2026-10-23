import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

import { useToneColors } from '../use-tone-colors';

type Props = { teamA: TeamInfo; teamB: TeamInfo; played: number; winsA: number; winsB: number };

/** The last word of a team name: "Chattogram Strikers" becomes "Strikers". */
const nickname = (team: TeamInfo) => team.name.split(' ').slice(-1)[0];

/** Win count for each side with a split bar between them. */
export function HeadToHeadRecord({ teamA, teamB, played, winsA, winsB }: Props) {
  const styles = useThemedStyles(createStyles);
  const toneColors = useToneColors();
  const a = toneColors(teamA.tone);
  const b = toneColors(teamB.tone);
  return (
    <View
      accessible
      accessibilityLabel={`${played} matches played. ${nickname(teamA)} won ${winsA}, ${nickname(teamB)} won ${winsB}`}
      style={styles.block}
    >
      <View style={styles.numbers}>
        <Text style={[styles.wins, { color: a.ink }]}>{winsA}</Text>
        <Text muted style={styles.played}>
          {played} matches played
        </Text>
        <Text style={[styles.wins, { color: b.ink }]}>{winsB}</Text>
      </View>
      <View style={styles.bar}>
        <View style={[styles.segment, { flex: winsA, backgroundColor: a.fill }]} />
        <View style={[styles.segment, { flex: winsB, backgroundColor: b.fill }]} />
      </View>
      <View style={styles.names}>
        <Text muted style={styles.nameText}>
          {nickname(teamA)} wins
        </Text>
        <Text muted style={styles.nameText}>
          {nickname(teamB)} wins
        </Text>
      </View>
    </View>
  );
}

const createStyles = (_colors: Palette) =>
  StyleSheet.create({
    block: { gap: 10 },
    numbers: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    wins: { fontSize: 40, lineHeight: 44, fontWeight: '800', fontVariant: ['tabular-nums'] },
    played: { fontSize: 13, lineHeight: 18 },
    bar: { flexDirection: 'row', gap: 4, height: 10 },
    segment: { borderRadius: 5 },
    names: { flexDirection: 'row', justifyContent: 'space-between' },
    nameText: { fontSize: 12, lineHeight: 16 },
  });
