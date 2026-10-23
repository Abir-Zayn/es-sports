import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

type Props = { team: TeamInfo; standing: string; onBack: () => void };

/** Slim header for the team's inner screens: back, team avatar, name and where it stands. */
export function TeamCompactHeader({ team, standing, onBack }: Props) {
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
      <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={40} />
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={styles.name} numberOfLines={1}>
          {team.name}
        </Text>
        <Text muted style={styles.standing} numberOfLines={1}>
          {standing}
        </Text>
      </View>
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    titles: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    standing: { fontSize: 12, lineHeight: 16 },
  });
