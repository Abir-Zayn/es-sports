import { useEffect, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import type { DeviceEligibility, StreamPreset, StreamStatus } from '@modules/live-stream';

import { getRememberKey, loadDestination, setRememberKey } from '../session/destination-store';
import type { RecoveryDecision } from '../session/session-descriptor';

const FACEBOOK_URL = 'rtmps://live-api-s.facebook.com:443/rtmp/';
const ACTIVE = new Set(['preparing', 'connecting', 'live', 'reconnecting', 'error']);

type Props = {
  status: StreamStatus | null;
  eligibility: DeviceEligibility | null;
  decision: RecoveryDecision;
  busy: boolean;
  onGoLive: (input: { destination: { url: string; key: string }; remember: boolean; preset: StreamPreset }) => void;
  onResume: () => void;
  onDiscard: () => void;
  onEnd: () => void;
  onRetry: () => void;
};

/** Facebook Live only: paste the server URL and stream key from Facebook, then Go live. 720p30. */
export function FacebookControls({ status, eligibility, decision, busy, onGoLive, onResume, onDiscard, onEnd, onRetry }: Props) {
  const [url, setUrl] = useState(FACEBOOK_URL);
  const [key, setKey] = useState('');
  const [remember, setRemember] = useState(true);

  useEffect(() => {
    let alive = true;
    void Promise.all([loadDestination('facebook'), getRememberKey()]).then(([saved, rem]) => {
      if (!alive) return;
      setUrl(saved?.url ?? FACEBOOK_URL);
      setKey(saved?.key ?? '');
      setRemember(rem);
    });
    return () => { alive = false; };
  }, []);

  const active = status ? ACTIVE.has(status.state) : false;
  const check = eligibility?.presets['720p30'];
  const canStart = !active && !busy && url.trim().length > 0 && key.trim().length > 0 && check?.ok === true;

  return (
    <View style={styles.box}>
      {decision.kind === 'resume' ? (
        <View style={styles.resume} accessibilityLiveRegion="polite">
          <Text style={styles.bold}>Resume available</Text>
          <Text muted>Your broadcast stopped unexpectedly. Facebook may have started a new video, so check your Facebook live page.</Text>
          <View style={styles.row}>
            <Button label="Resume broadcast" onPress={onResume} loading={busy} />
            <Button label="Discard" variant="ghost" onPress={onDiscard} />
          </View>
        </View>
      ) : null}
      {!active ? (
        <>
          <Text muted>On Facebook, create a live video and choose &ldquo;Streaming software&rdquo;. Copy the Server URL and the Stream key into the fields below.</Text>
          {check && !check.ok ? <Text accessibilityRole="alert">{check.reasons.join(' ') || 'This phone cannot stream.'}</Text> : null}
          <TextField label="Server URL" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} />
          <TextField label="Stream key" value={key} onChangeText={setKey} secureTextEntry autoCapitalize="none" autoCorrect={false} />
          <View style={styles.switchRow}>
            <Text>Remember the stream key on this phone</Text>
            <Switch accessibilityLabel="Remember stream key" value={remember} onValueChange={(v) => { setRemember(v); void setRememberKey(v); }} />
          </View>
        </>
      ) : null}
      <View style={styles.row}>
        <Button label="Go live" disabled={!canStart} loading={busy}
          onPress={() => onGoLive({ destination: { url: url.trim(), key: key.trim() }, remember, preset: '720p30' })} />
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
