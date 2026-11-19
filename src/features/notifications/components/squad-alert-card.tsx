import ShieldAlert from 'lucide-react-native/icons/shield-alert';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, sizes, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { AppNotification } from '../types';
import { NotificationRow } from './notification-row';

export function SquadAlertCard({ item, onOpen }: { item: AppNotification; onOpen: () => void }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const alert = item.meta?.squadAlert;
  return <NotificationRow item={item} icon={<ShieldAlert size={sizes.icon} color={colors.danger} />}>
    {alert ? <>
      <Text style={styles.context}>{alert.tournamentName} · {alert.performedByName}</Text>
      {alert.reason ? <Text style={styles.context}>{t('notifications.reason', { reason: alert.reason })}</Text> : null}
      <Pressable accessibilityRole="button" onPress={onOpen} style={styles.action}><Text style={styles.link}>{t('notifications.viewTournament')}</Text></Pressable>
    </> : null}
  </NotificationRow>;
}
const createStyles = (c: Palette) => StyleSheet.create({
  context: { ...typography.bodySm, color: c.textMuted },
  action: { minHeight: dp(48), justifyContent: 'center', alignSelf: 'flex-start' }, link: { ...typography.labelMd, color: c.link },
});
