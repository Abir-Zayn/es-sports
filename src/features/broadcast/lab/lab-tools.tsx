import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { LiveStream, THERMAL } from '@modules/live-stream';

type Props = { onBall: (label: string) => void; matchId: string; onMatchId: (id: string) => void; log: (text: string) => void };

/** Blocks the JS thread on purpose (S3). Native keeps streaming the last overlay meanwhile. */
function freezeJs(ms: number) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    // busy wait: deliberate
  }
}

/** Phase 0 fault injection and data sources. Every action is logged to the CSV as a marker. */
export function LabTools({ onBall, matchId, onMatchId, log }: Props) {
  const [csvPath, setCsvPath] = useState<string | null>(null);

  const toggleCsv = () => {
    if (!LiveStream) return;
    if (csvPath) {
      LiveStream.setStatsLogging(false);
      setCsvPath(null);
    } else {
      setCsvPath(LiveStream.setStatsLogging(true));
    }
  };

  const mark = (name: string) => {
    LiveStream?.logMarker(name, '');
    log(name);
  };

  return (
    <View style={styles.box}>
      <Text style={styles.title}>Score source</Text>
      <TextField label="Real match id (blank = synthetic)" value={matchId} onChangeText={onMatchId} autoCapitalize="none" />
      <View style={styles.row}>
        {['0', '1', '4', '6', 'W'].map((b) => <Button key={b} label={b} size="compact" variant="secondary" onPress={() => onBall(b)} />)}
      </View>
      <Text style={styles.title}>Instrumentation</Text>
      <View style={styles.row}>
        <Button label={csvPath ? 'Stop CSV log' : 'Start CSV log'} size="compact" variant="secondary" onPress={toggleCsv} />
        <Button label="Mark: network off" size="compact" variant="ghost" onPress={() => mark('tester_network_off')} />
        <Button label="Mark: network on" size="compact" variant="ghost" onPress={() => mark('tester_network_on')} />
      </View>
      {csvPath ? <Text muted style={styles.small}>{csvPath}</Text> : null}
      <Text style={styles.title}>Fault injection</Text>
      <View style={styles.row}>
        <Button label="Freeze JS 30 s" size="compact" variant="secondary" onPress={() => { mark('js_freeze_start'); freezeJs(30_000); mark('js_freeze_end'); }} />
        {/* S4b: thrown outside React so no error boundary catches it; fatal in release builds. */}
        <Button label="JS crash" size="compact" variant="secondary" onPress={() => {
          mark('js_crash');
          setTimeout(() => { throw new Error('Phase 0 lab: deliberate JS crash'); }, 0);
        }} />
        <Button label="Native crash" size="compact" variant="secondary" onPress={() => { mark('native_crash'); LiveStream?.labCrashNative(); }} />
        <Button label="Thermal SEVERE" size="compact" variant="ghost" onPress={() => LiveStream?.labSimulateThermal(THERMAL.SEVERE)} />
        <Button label="Thermal CRITICAL" size="compact" variant="ghost" onPress={() => LiveStream?.labSimulateThermal(THERMAL.CRITICAL)} />
        <Button label="Battery 4%" size="compact" variant="ghost" onPress={() => LiveStream?.labSimulateBattery(4)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  title: { fontWeight: '700', marginTop: 4 },
  small: { fontSize: 11, lineHeight: 15 },
});
