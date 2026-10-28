import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import Star from 'lucide-react-native/icons/star';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type AvatarTone } from '@/theme';

type Props = {
  short: string;
  name: string;
  tone: AvatarTone;
  avatarUri?: string;
  /** Format line under the name. */
  format: string;
  onBack: () => void;
  rightAction?: ReactNode;
};

/** Slim header for the tournament's inner screens: back, logo, name and format. */
export function TournamentCompactHeader({
  short,
  name,
  tone,
  avatarUri,
  format,
  onBack,
  rightAction,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const [favorite, setFavorite] = useState(false);

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
      <InitialsAvatar label={short} tone={tone} imageUri={avatarUri} size={40} shape="square" borderColor={colors.primary} borderWidth={2} />
      <View style={styles.titles}>
        <Text accessibilityRole="header" style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text muted style={styles.format} numberOfLines={1}>
          {format}
        </Text>
      </View>
      {rightAction ?? (
        <AppIconTile
          icon={Star}
          size={44}
          borderRadius={radius.pill}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          accessibilityLabel={favorite ? 'Unfavorite tournament' : 'Favorite tournament'}
          onPress={() => setFavorite((val) => !val)}
        />
      )}
    </View>
  );
}

const createStyles = () =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    titles: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    format: { fontSize: 12, lineHeight: 16 },
  });
