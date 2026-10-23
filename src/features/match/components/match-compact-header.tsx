import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBadge, AppIconTile, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles } from '@/theme';

type Props = { title: string; subtitle: string; onBack: () => void };

/** Slim header for the match's inner screens: back, the two teams, the competition and a live badge. */
export function MatchCompactHeader({ title, subtitle, onBack }: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={[styles.row, { paddingTop: insets.top + spacing.sm }]}>
      <AppIconTile
        icon={ChevronLeft}
        size={44}
        borderRadius={radius.pill}
        backgroundColor={colors.surface}
        borderColor={colors.border}
        borderWidth={1}
        accessibilityLabel="Back"
        onPress={onBack}
      />
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text muted style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <AppBadge dot label="LIVE" backgroundColor={colors.live} color={colors.onLive} />
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    titles: { flex: 1, minWidth: 0, gap: 2 },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    subtitle: { fontSize: 12, lineHeight: 16 },
  });
