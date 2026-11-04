import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { DeviceEligibility, StreamStatus } from '@modules/live-stream';

import type { LabLogEntry } from './use-live-stream';

const GIB = 1024 ** 3;

/** User-facing label for the four recovery states (§8.6) plus the raw native state for testers. */
function headline(status: StreamStatus | null): string {
  if (!status) return 'Native module unavailable in this build';
  switch (status.state) {
    case 'reconnecting': return `Reconnecting… attempt ${status.reconnectAttempt} · video paused for viewers`;
    case 'error': return status.lastError?.code === 'E_NETWORK_EXHAUSTED' || status.lastError?.code === 'E_DESTINATION_REJECTED'
      ? `Recovery failed: ${status.lastError.message}` : `Error: ${status.lastError?.message ?? 'unknown'}`;
    case 'live': return status.quality === 'degraded' ? 'LIVE · below the platform\'s recommended minimum bitrate' : 'LIVE';
    case 'idle': return 'Not streaming';
    default: return status.state;
  }
}

export function LabStatus({ status, eligibility, log }: { status: StreamStatus | null; eligibility: DeviceEligibility | null; log: LabLogEntry[] }) {
  return (
    <View style={styles.box}>
      <Text accessibilityRole="header" style={styles.headline} accessibilityLiveRegion="polite">{headline(status)}</Text>
      {status ? (
        <Text muted style={styles.mono}>
          {`state ${status.state} · ${status.preset} · ${status.platform}\n`}
          {`target ${status.bitrateKbps} kbps · measured ${status.measuredKbps} kbps · fps ${status.fps}\n`}
          {`dropped ${status.droppedFrames} / sent ${status.sentFrames} · queue ${status.queueItems}${status.congested ? ' · congested' : ''}\n`}
          {`overlay age ${status.overlayAgeMs === null ? '–' : `${Math.round(status.overlayAgeMs / 1000)} s`} · thermal ${status.thermal ?? 'unknown'}`}
        </Text>
      ) : null}
      {eligibility ? (
        <Text muted style={styles.mono}>
          {`RAM ${(eligibility.totalMemBytes / GIB).toFixed(2)} GiB reported`}
          {eligibility.advertisedMemBytes ? ` · ${(eligibility.advertisedMemBytes / GIB).toFixed(1)} GiB advertised` : ''}
          {` · ${eligibility.meetsRam ? 'meets' : 'below'} 4 GB\n`}
          {`API ${eligibility.apiLevel} · HW encoders ${eligibility.encoders.filter((e) => e.hardware).map((e) => e.name).join(', ') || 'none'}\n`}
          {`battery ${eligibility.batteryPercent ?? '?'}%${eligibility.charging ? ' charging' : ''} · upstream ${eligibility.upstreamKbps ?? '?'} kbps (OS estimate)`}
        </Text>
      ) : null}
      <View style={styles.log}>
        {log.map((entry) => (
          <Text key={entry.id} muted style={styles.mono}>{`${new Date(entry.at).toISOString().slice(11, 19)} ${entry.text}`}</Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { gap: 8 },
  headline: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
  mono: { fontSize: 12, lineHeight: 17, fontVariant: ['tabular-nums'] },
  log: { gap: 2 },
});
