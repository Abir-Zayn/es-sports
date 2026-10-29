import CircleDot from 'lucide-react-native/icons/circle-dot';
import { Pressable, StyleSheet } from 'react-native';
import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';
import type { AppNotification } from '../types';
import { NotificationRow } from './notification-row';

export function MatchUpdateCard({ item, onOpen }: { item: AppNotification; onOpen: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const match = item.meta?.matchUpdate;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Open match: ${item.title}`} onPress={onOpen} disabled={!match}>
    <NotificationRow item={item} icon={<CircleDot size={24} color={colors.link} />}>
      {match ? <Text style={styles.context}>{match.matchLabel} · {match.headline}</Text> : null}
    </NotificationRow>
  </Pressable>;
}
const createStyles = (c: Palette) => StyleSheet.create({ context: { color: c.link, fontSize: 13, lineHeight: 19, fontWeight: '600' } });
