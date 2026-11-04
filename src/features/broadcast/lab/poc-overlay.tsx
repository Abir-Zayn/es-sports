import { StyleSheet, Text as RNText, View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';

import type { LabScore } from './use-lab-score';

export type FlashStep = 'enter' | 'hold' | 'exit' | null;

/**
 * Phase 0 proof-of-concept graphics: scorebug + runs-per-over bars (SVG, exercises G12) + a stepped flash.
 * Fixed broadcast colours, not theme colours: the stream looks the same whatever the phone's dark/light mode.
 * Laid out in a 1280×720 coordinate space; the parent scales it.
 */
export function PocOverlay({ score, flash }: { score: LabScore; flash: { label: string; step: FlashStep } | null }) {
  const bars = score.runsPerOver.slice(-12);
  const max = Math.max(6, ...bars);
  const barWidth = 22;
  const chartHeight = 120;
  return (
    <View style={styles.canvas} pointerEvents="none">
      <View style={styles.chart}>
        <RNText style={styles.chartTitle}>RUNS PER OVER</RNText>
        <Svg width={bars.length * (barWidth + 6)} height={chartHeight}>
          {bars.map((runs, i) => {
            const h = Math.max(2, (runs / max) * (chartHeight - 4));
            const wickets = score.wicketsPerOver.slice(-12)[i] ?? 0;
            return <Rect key={`over-${score.runsPerOver.length - bars.length + i}`} x={i * (barWidth + 6)} y={chartHeight - h}
              width={barWidth} height={h} rx={3} fill={wickets > 0 ? '#FF5A5F' : '#4F7CFF'} />;
          })}
        </Svg>
      </View>
      {flash?.step ? (
        <View style={[styles.flash, flash.step === 'enter' && styles.flashEnter, flash.step === 'exit' && styles.flashExit]}>
          <RNText style={styles.flashText}>{flash.label}</RNText>
        </View>
      ) : null}
      <View style={styles.bug}>
        <View style={styles.brand}><RNText style={styles.brandText}>ES</RNText></View>
        <RNText style={styles.team}>{score.battingShort}</RNText>
        <RNText style={styles.score}>{score.score}</RNText>
        <RNText style={styles.overs}>{score.overs} ov</RNText>
        <RNText style={styles.vs}>v {score.bowlingShort}</RNText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: { width: 1280, height: 720, backgroundColor: 'transparent' },
  chart: { position: 'absolute', right: 40, top: 40, padding: 16, borderRadius: 14, backgroundColor: '#0A0E0DE6', gap: 8 },
  chartTitle: { color: '#C9D3CF', fontSize: 16, fontWeight: '800', letterSpacing: 1 },
  flash: { position: 'absolute', left: 440, top: 260, width: 400, height: 140, borderRadius: 20, backgroundColor: '#FFC83D', alignItems: 'center', justifyContent: 'center' },
  flashEnter: { opacity: 0.6, transform: [{ scale: 0.9 }] },
  flashExit: { opacity: 0.4 },
  flashText: { color: '#04121A', fontSize: 64, fontWeight: '900' },
  bug: { position: 'absolute', left: 40, bottom: 40, height: 64, borderRadius: 12, backgroundColor: '#0A0E0D', flexDirection: 'row', alignItems: 'center', overflow: 'hidden', paddingRight: 20, gap: 16 },
  brand: { width: 64, height: 64, backgroundColor: '#4F7CFF', alignItems: 'center', justifyContent: 'center' },
  brandText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  team: { color: '#FFFFFF', fontSize: 24, fontWeight: '800' },
  score: { color: '#FFFFFF', fontSize: 32, fontWeight: '900' },
  overs: { color: '#C9D3CF', fontSize: 20, fontWeight: '600' },
  vs: { color: '#C9D3CF', fontSize: 20 },
});
