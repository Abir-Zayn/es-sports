import Bell from 'lucide-react-native/icons/bell';
import Search from 'lucide-react-native/icons/search';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { HomeUser } from '../sample-data';

type Props = {
  user: HomeUser;
  onProfile: () => void;
  onSearch: () => void;
  onNotifications: () => void;
};

/** Avatar, greeting, search and notifications. */
export function TopBar({ user, onProfile, onSearch, onNotifications }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="My profile" onPress={onProfile}>
        <InitialsAvatar
          label={user.initials}
          tone={user.tone}
          imageUri={user.avatarUri}
          size={46}
          borderColor={colors.primary}
          borderWidth={2}
        />
      </Pressable>
      <View style={styles.greeting}>
        <Text style={styles.welcome}>Welcome back</Text>
        <Text style={styles.name}>{user.name}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Search" onPress={onSearch} style={styles.roundButton}>
        <Search size={20} color={colors.text} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Notifications, ${user.unreadNotifications} unread`}
        onPress={onNotifications}
        style={styles.roundButton}
      >
        <Bell size={20} color={colors.text} />
        {user.unreadNotifications > 0 ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    greeting: { flex: 1, gap: 2 },
    welcome: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
    name: { fontSize: 18, lineHeight: 24, fontWeight: '700' },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    unreadDot: {
      position: 'absolute',
      top: 9,
      right: 10,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: colors.live,
      borderWidth: 2,
      borderColor: colors.surface,
    },
  });
