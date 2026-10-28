import Svg, { Line } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { KnockoutBracketDraw, KnockoutMatch } from '../types';
import { BracketConnectorFork } from './bracket-connector-fork';
import { CARD_WIDTH, KnockoutMatchCard } from './knockout-match-card';

const CANVAS_WIDTH = 400;
const INTRA_PAIR_GAP = 14;
const INTER_PAIR_GAP = 28;

// X coordinates for Round of 16 cards (0, 100, 214, 314)
const R16_X0 = 0;
const R16_X1 = CARD_WIDTH + INTRA_PAIR_GAP; // 100
const R16_X2 = R16_X1 + CARD_WIDTH + INTER_PAIR_GAP; // 214
const R16_X3 = R16_X2 + CARD_WIDTH + INTRA_PAIR_GAP; // 314

// Quarter final X coordinates (50, 264)
const QF_X0 = Math.round((R16_X0 + R16_X1) / 2); // 50
const QF_X1 = Math.round((R16_X2 + R16_X3) / 2); // 264

// Semi final X coordinate (157)
const SF_X = Math.round((QF_X0 + QF_X1) / 2); // 157

type Props = {
  draw: KnockoutBracketDraw;
  onMatchPress?: (match: KnockoutMatch) => void;
  showDropLineToFinal?: boolean;
};

/** A complete single bracket draw: Round of 16 down to Semi final. */
export function KnockoutBracketSide({
  draw,
  onMatchPress,
  showDropLineToFinal = true,
}: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      {/* Round of 16 */}
      <Text style={styles.roundLabel}>Round of 16</Text>
      <View style={styles.r16Row}>
        <View style={{ position: 'absolute', left: R16_X0 }}>
          <KnockoutMatchCard match={draw.r16[0]} onPress={onMatchPress} />
        </View>
        <View style={{ position: 'absolute', left: R16_X1 }}>
          <KnockoutMatchCard match={draw.r16[1]} onPress={onMatchPress} />
        </View>
        <View style={{ position: 'absolute', left: R16_X2 }}>
          <KnockoutMatchCard match={draw.r16[2]} onPress={onMatchPress} />
        </View>
        <View style={{ position: 'absolute', left: R16_X3 }}>
          <KnockoutMatchCard match={draw.r16[3]} onPress={onMatchPress} />
        </View>
      </View>

      {/* Connectors R16 -> QF */}
      <View style={styles.forkRow}>
        <View style={{ position: 'absolute', left: R16_X0 }}>
          <BracketConnectorFork
            width={CARD_WIDTH * 2 + INTRA_PAIR_GAP}
            height={28}
            x1={CARD_WIDTH / 2}
            x2={CARD_WIDTH + INTRA_PAIR_GAP + CARD_WIDTH / 2}
          />
        </View>
        <View style={{ position: 'absolute', left: R16_X2 }}>
          <BracketConnectorFork
            width={CARD_WIDTH * 2 + INTRA_PAIR_GAP}
            height={28}
            x1={CARD_WIDTH / 2}
            x2={CARD_WIDTH + INTRA_PAIR_GAP + CARD_WIDTH / 2}
          />
        </View>
      </View>

      {/* Quarter final */}
      <Text style={styles.roundLabel}>Quarter final</Text>
      <View style={styles.qfRow}>
        <View style={{ position: 'absolute', left: QF_X0 }}>
          <KnockoutMatchCard match={draw.qf[0]} onPress={onMatchPress} />
        </View>
        <View style={{ position: 'absolute', left: QF_X1 }}>
          <KnockoutMatchCard match={draw.qf[1]} onPress={onMatchPress} />
        </View>
      </View>

      {/* Connectors QF -> SF */}
      <View style={styles.qfForkWrapper}>
        <BracketConnectorFork
          width={CANVAS_WIDTH}
          height={32}
          x1={QF_X0 + CARD_WIDTH / 2}
          x2={QF_X1 + CARD_WIDTH / 2}
        />
      </View>

      {/* Semi final */}
      <Text style={styles.roundLabel}>Semi final</Text>
      <View style={styles.sfRow}>
        <View style={{ position: 'absolute', left: SF_X }}>
          <KnockoutMatchCard match={draw.sf} onPress={onMatchPress} />
        </View>
      </View>

      {/* Connector line down towards Final */}
      {showDropLineToFinal && (
        <View style={styles.finalDropWrapper}>
          <Svg width={CANVAS_WIDTH} height={34} viewBox={`0 0 ${CANVAS_WIDTH} 34`}>
            <Line
              x1={SF_X + CARD_WIDTH / 2}
              y1={0}
              x2={SF_X + CARD_WIDTH / 2}
              y2={34}
              stroke={colors.border}
              strokeWidth={1.5}
            />
          </Svg>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    container: {
      width: CANVAS_WIDTH,
      alignItems: 'center',
    },
    roundLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.textMuted,
      marginBottom: spacing.xs,
      textAlign: 'center',
    },
    r16Row: {
      width: CANVAS_WIDTH,
      height: 68,
      position: 'relative',
    },
    forkRow: {
      width: CANVAS_WIDTH,
      height: 28,
      position: 'relative',
      marginVertical: 4,
    },
    qfRow: {
      width: CANVAS_WIDTH,
      height: 68,
      position: 'relative',
    },
    qfForkWrapper: {
      width: CANVAS_WIDTH,
      height: 32,
      marginVertical: 4,
    },
    sfRow: {
      width: CANVAS_WIDTH,
      height: 68,
      position: 'relative',
    },
    finalDropWrapper: {
      width: CANVAS_WIDTH,
      height: 34,
      marginTop: 4,
    },
  });

