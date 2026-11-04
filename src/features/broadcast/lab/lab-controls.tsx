import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button, SegmentedControl, Text, TextField } from '@/components/ui';
import type { DeviceEligibility, StreamPlatform, StreamPreset, StreamStatus } from '@modules/live-stream';

import { clearDestination, getRememberKey, loadDestination, setRememberKey } from '../session/destination-store';
import type { RecoveryDecision } from '../session/session-descriptor';

type Props = {
  status: StreamStatus | null;
  eligibility: DeviceEligibility | null;
  decision: RecoveryDecision;
  busy: boolean;
  onGoLive: (input: { platform: StreamPlatform; preset: StreamPreset; destination: { url: string; key: string }; remember: boolean }) => void;
  onResume: () => void;
  onDiscard: () => void;
  onEnd: () => void;
  onRetry: () => void;
};

const ACTIVE = new Set(['preparing', 'connecting', 'live', 'reconnecting', 'error']);

/** Destination entry, preset, Go Live / End / Retry, and the Resume Available card (§8.6 states). */
export function LabControls({ status, eligibility, decision, busy, onGoLive, onResume, onDiscard, onEnd, onRetry }: Props) {
  const [platform, setPlatform] = useState<StreamPlatform>('youtube');
  const [preset, setPreset] = useState<StreamPreset>('720p30');
  const [url, setUrl] = useState('');
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    let alive = true;
    void Promise.all([loadDestination(platform), getRememberKey()]).then(([saved, rem]) => {
      if (!alive) return;
      setUrl(saved?.url ?? (platform === 'youtube' ? 'rtmps://a.rtmp.youtube.com/live2' : 'rtmps://live-api-s.facebook.com:443/rtmp/'));
      setKey(saved?.key ?? '');
      setRemember(rem);
    });
    return () => { alive = false; };
  }, [platform]);

  const active = status ? ACTIVE.has(status.state) : false;
  const presetCheck = eligibility?.presets[preset];
  const canStart = !active && !busy && url.length > 0 && key.length > 0 && presetCheck?.ok === true;

  return (
    <View style={styles.box}>
      {decision.kind === 'resume' ? (
        <View style={styles.resume} accessibilityLiveRegion="polite">
          <Text style={styles.bold}>Resume available</Text>
          <Text muted>Your broadcast stopped unexpectedly ({decision.descriptor.platform}, {decision.descriptor.preset}). YouTube or Facebook may have started a new video.</Text>
          <View style={styles.row}>
            <Button label="Resume broadcast" onPress={onResume} loading={busy} />
            <Button label="Discard" variant="ghost" onPress={onDiscard} />
          </View>
        </View>
      ) : null}
      <SegmentedControl<StreamPlatform> accessibilityLabel="Platform" selected={platform} onSelect={setPlatform}
        options={[{ id: 'youtube', label: 'YouTube' }, { id: 'facebook', label: 'Facebook' }]} />
      <SegmentedControl<StreamPreset> accessibilityLabel="Quality" selected={preset} onSelect={setPreset}
        options={[{ id: '720p30', label: '720p30' }, { id: '1080p30', label: '1080p30' }]} />
      {presetCheck && !presetCheck.ok ? <Text muted>{presetCheck.reasons.join(' ')}</Text> : null}
      <TextField label="Server URL" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} />
      <TextField label="Stream key" value={key} onChangeText={setKey} secureTextEntry autoCapitalize="none" autoCorrect={false} />
      <View style={styles.switchRow}>
        <Text>Remember stream key on this phone</Text>
        <Switch accessibilityLabel="Remember stream key" value={remember}
          onValueChange={(v) => { setRemember(v); void setRememberKey(v); }} />
      </View>
      <Button label="Clear saved keys" variant="ghost" size="compact" onPress={() => { void clearDestination(); setKey(''); }} />
      <View style={styles.row}>
        <Button label="Go live" disabled={!canStart} loading={busy} onPress={() => onGoLive({ platform, preset, destination: { url, key }, remember })} />
        <Button label="End broadcast" variant="secondary" disabled={!active} onPress={onEnd} />
        {status?.state === 'error' && !status.lastError?.fatal ? <Button label="Retry" variant="secondary" onPress={onRetry} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  resume: { gap: 6, padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#FFC83D' },
  bold: { fontWeight: '700' },
});
