import { useEffect, useRef, useState } from 'react';
import { AppState, PermissionsAndroid, ScrollView, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';
import { CameraPreview, LiveStream, OverlayHost, THERMAL, type DeviceEligibility, type OverlayHostHandle } from '@modules/live-stream';

import { LabStatus } from '../lab/lab-status';
import { PocOverlay } from '../lab/poc-overlay';
import { useLabScore } from '../lab/use-lab-score';
import { useLabSession } from '../lab/use-lab-session';
import { useLiveStream } from '../lab/use-live-stream';
import { useStepFlash } from '../lab/use-step-flash';
import { useOverlayCapture } from '../overlay/use-overlay-capture';
import { FacebookControls } from './facebook-controls';
import { useBroadcastSync } from './use-broadcast-sync';

const DIMS = { '720p30': { w: 1280, h: 720 }, '1080p30': { w: 1920, h: 1080 } } as const;

type Props = { fixtureId: string; matchId: string; title: string };

/**
 * The streamer's console: camera preview with the live score burned in, Facebook destination, Go live / End.
 * The score follows the real match through the spectator pipeline, so the scorer's balls appear in the stream.
 */
export function ConsoleBody({ fixtureId, matchId, title }: Props) {
  const { colors } = useTheme();
  const { available, status, log, push, refresh } = useLiveStream();
  const session = useLabSession(status, push, matchId);
  useBroadcastSync(fixtureId, status?.state, push);
  const [eligibility, setEligibility] = useState<DeviceEligibility | null>(null);
  const [previewWidth, setPreviewWidth] = useState(0);
  const hostRef = useRef<OverlayHostHandle | null>(null);
  const { score } = useLabScore(matchId);
  const flash = useStepFlash(score, (status?.thermal ?? 0) < THERMAL.MODERATE);
  const dims = DIMS[status?.preset ?? '720p30'];
  const recapture = useOverlayCapture(hostRef, `${JSON.stringify(score)}|${flash?.label}|${flash?.step}|${dims.w}`, () => {});

  useEffect(() => {
    let alive = true;
    (async () => {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      ]);
      const result = await LiveStream?.getDeviceEligibility();
      if (alive && result) setEligibility(result);
    })().catch(() => push('eligibility check failed'));
    return () => { alive = false; };
  }, [push]);

  // On return to the foreground rebuild the overlay from current data instead of trusting the old bitmap.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => { if (s === 'active') recapture(); });
    return () => sub.remove();
  }, [recapture]);

  if (!available) {
    return <SafeAreaView style={[styles.fill, styles.pad, { backgroundColor: colors.background }]}><Text>This build cannot stream. Install the latest Android development build.</Text></SafeAreaView>;
  }
  const scale = previewWidth > 0 ? previewWidth / 1280 : 0;
  const onPreviewLayout = (e: LayoutChangeEvent) => setPreviewWidth(Math.max(0, e.nativeEvent.layout.width));
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
        <Text accessibilityRole="header" style={styles.title}>{title}</Text>
        <FacebookControls status={status} eligibility={eligibility} decision={session.decision} busy={session.busy}
          onGoLive={({ destination, remember, preset }) => void session.goLive({ platform: 'facebook', preset, destination, remember })}
          onResume={session.resume} onDiscard={session.discard} onEnd={() => void session.end().then(refresh)} onRetry={() => void LiveStream?.retry()} />
      </ScrollView>
      <OverlayHost ref={hostRef} streamWidth={dims.w} streamHeight={dims.h} style={styles.host}>
        <PocOverlay score={score} flash={flash} />
      </OverlayHost>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { padding: 16 },
  row: { flexDirection: 'row' },
  left: { flex: 11, padding: 12, gap: 10 },
  right: { flex: 9 },
  rightContent: { padding: 12, gap: 14, paddingBottom: 40 },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  preview: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000000', borderRadius: 12, overflow: 'hidden' },
  scaled: { position: 'absolute', left: 0, top: 0, width: 1280, height: 720, transformOrigin: 'top left' },
  host: { position: 'absolute', left: -20000, top: 0, width: 1280, height: 720 },
});
