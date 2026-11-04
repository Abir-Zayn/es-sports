import { useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { CameraPreview, LiveStream, OverlayHost, THERMAL, type DeviceEligibility, type OverlayHostHandle } from '@modules/live-stream';

import { useOverlayCapture } from '../overlay/use-overlay-capture';
import { LabControls } from './lab-controls';
import { LabStatus } from './lab-status';
import { LabTools } from './lab-tools';
import { PocOverlay } from './poc-overlay';
import { useLabScore } from './use-lab-score';
import { useLabSession } from './use-lab-session';
import { useLiveStream } from './use-live-stream';
import { useStepFlash } from './use-step-flash';

const DIMS = { '720p30': { w: 1280, h: 720 }, '1080p30': { w: 1920, h: 1080 } } as const;

/**
 * Phase 0 test bench (NOT production UI): native engine, recovery, eligibility and the overlay capture PoC.
 * Reached only via essports://broadcast-lab when the lab flag is set (see src/app/broadcast-lab.tsx).
 */
export function BroadcastLabScreen() {
  const { colors } = useTheme();
  const { available, status, log, push, refresh } = useLiveStream();
  const session = useLabSession(status, push);
  const [eligibility, setEligibility] = useState<DeviceEligibility | null>(null);
  const [matchInput, setMatchInput] = useState('');
  const [matchId, setMatchId] = useState('');
  const [previewWidth, setPreviewWidth] = useState(0);
  const hostRef = useRef<OverlayHostHandle | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setMatchId(matchInput.trim()), 400);
    return () => clearTimeout(t);
  }, [matchInput]);

  const { score, addBall } = useLabScore(matchId);
  const flash = useStepFlash(score, (status?.thermal ?? 0) < THERMAL.MODERATE);
  const dims = DIMS[status?.preset ?? '720p30'];
  const recapture = useOverlayCapture(hostRef, `${JSON.stringify(score)}|${flash?.label}|${flash?.step}|${dims.w}`, (r) =>
    LiveStream?.logMarker('overlay_js', `ok=${r.ok} ms=${r.ms.toFixed(1)} seq=${score.ballSeq} score=${score.score}`));

  useEffect(() => {
    LiveStream?.setLabMode(true);
    let alive = true;
    (async () => {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
      const result = await LiveStream?.getDeviceEligibility();
      if (alive && result) setEligibility(result);
    })().catch(() => push('eligibility check failed'));
    return () => {
      alive = false;
      LiveStream?.setLabMode(false);
    };
  }, [push]);

  // S1/S3: on return to the foreground, rebuild the overlay from current data instead of trusting the old bitmap.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') recapture(); });
    return () => sub.remove();
  }, [recapture]);

  const scale = previewWidth > 0 ? previewWidth / 1280 : 0;
  const onPreviewLayout = (e: LayoutChangeEvent) => setPreviewWidth(Math.max(0, e.nativeEvent.layout.width));

  if (!available) {
    return <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}><Text>This build does not include the live-stream module. Install a development build made after Phase 0.</Text></SafeAreaView>;
  }
  return (
    <SafeAreaView style={[styles.fill, styles.row, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.left}>
        <View style={styles.preview} onLayout={onPreviewLayout}>
          <CameraPreview style={StyleSheet.absoluteFill} />
          {scale > 0 ? <View style={[styles.scaled, { transform: [{ scale }] }]} pointerEvents="none"><PocOverlay score={score} flash={flash} /></View> : null}
        </View>
        <LabStatus status={status} eligibility={eligibility} log={log} />
      </View>
      <ScrollView style={styles.right} contentContainerStyle={styles.rightContent}>
        <Text accessibilityRole="header" style={styles.title}>Broadcast lab · Phase 0</Text>
        <LabControls status={status} eligibility={eligibility} decision={session.decision} busy={session.busy}
          onGoLive={session.goLive} onResume={session.resume} onDiscard={session.discard}
          onEnd={() => void session.end().then(refresh)} onRetry={() => void LiveStream?.retry()} />
        <LabTools onBall={addBall} matchId={matchInput} onMatchId={setMatchInput} log={push} />
      </ScrollView>
      {/* Off-screen capture host: laid out at 1280×720 dp, scaled natively to the stream resolution. */}
      <OverlayHost ref={hostRef} streamWidth={dims.w} streamHeight={dims.h} style={styles.host}>
        <PocOverlay score={score} flash={flash} />
      </OverlayHost>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  row: { flexDirection: 'row' },
  left: { flex: 11, padding: 12, gap: 10 },
  right: { flex: 9 },
  rightContent: { padding: 12, gap: 14, paddingBottom: 40 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  preview: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000000', borderRadius: 12, overflow: 'hidden' },
  scaled: { position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transformOrigin: 'top left' },
  host: { position: 'absolute', left: -20000, top: 0, width: 1280, height: 720 },
});
