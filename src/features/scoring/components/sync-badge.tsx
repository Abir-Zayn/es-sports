import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { SyncInfo } from '../use-match-sync';

const LABEL_KEYS = {
  local: 'scoring.sync.local',
  saving: 'scoring.sync.saving',
  saved: 'scoring.sync.saved',
  error: 'scoring.sync.error',
} as const;

export function SyncBadge({ sync }: { sync: SyncInfo }) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const failed = sync.mode === 'synced' && sync.status === 'error';
  const key = sync.mode === 'local' ? 'local' : failed ? 'error' : sync.status === 'saving' ? 'saving' : 'saved';
  return (
    <Pressable accessibilityRole={failed ? 'button' : 'text'} accessibilityLiveRegion="polite" disabled={!failed}
      hitSlop={sizes.hitSlop} onPress={sync.retry} style={[s.badge, failed && s.failed]}>
      <Text style={[s.text, failed && s.failedText]}>● {t(LABEL_KEYS[key])}</Text>
    </Pressable>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  badge: { alignSelf: 'flex-end', borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, backgroundColor: c.primarySoft, marginTop: -spacing.md, marginBottom: -spacing.sm },
  failed: { backgroundColor: c.dangerSoft },
  text: { ...typography.labelSm, color: c.link },
  failedText: { color: c.dangerSoftText },
});
