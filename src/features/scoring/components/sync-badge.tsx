import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { SyncInfo } from '../use-match-sync';

const LABELS = {
  local: 'Local draft · not synced',
  saving: 'Saving…',
  saved: 'Saved',
  error: 'Not saved · tap to retry',
} as const;

export function SyncBadge({ sync }: { sync: SyncInfo }) {
  const s = useThemedStyles(styles);
  const failed = sync.mode === 'synced' && sync.status === 'error';
  const key = sync.mode === 'local' ? 'local' : failed ? 'error' : sync.status === 'saving' ? 'saving' : 'saved';
  return (
    <Pressable accessibilityRole={failed ? 'button' : 'text'} accessibilityLiveRegion="polite" disabled={!failed}
      hitSlop={sizes.hitSlop} onPress={sync.retry} style={[s.badge, failed && s.failed]}>
      <Text style={[s.text, failed && s.failedText]}>● {LABELS[key]}</Text>
    </Pressable>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  badge: { alignSelf: 'flex-end', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: c.primarySoft, marginTop: -spacing.md, marginBottom: -spacing.sm },
  failed: { backgroundColor: c.dangerSoft },
  text: { ...typography.labelSm, color: c.link },
  failedText: { color: c.dangerSoftText },
});
