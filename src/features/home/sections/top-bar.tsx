import Bell from 'lucide-react-native/icons/bell';
import Search from 'lucide-react-native/icons/search';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { HomeUser } from '../sample-data';

// Lifts the 40dp round buttons to a 48dp touch target without changing their look.
const ICON_HIT_SLOP = dp(4);

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
  const unread = user.unreadNotifications ?? 0;
  const name = user.name?.trim();
  return (
    <View style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel="Open menu" hitSlop={ICON_HIT_SLOP} onPress={onProfile}>
        <InitialsAvatar
          label={user.initials}
          tone={user.tone}
          imageUri={user.avatarUri}
          size={dp(46)}
          borderColor={colors.primary}
          borderWidth={2}
        />
      </Pressable>
      <View style={styles.greeting} accessible accessibilityRole="header" accessibilityLabel={name ? `Welcome back, ${name}` : 'Welcome back'}>
        <Text style={styles.welcome}>Welcome back</Text>
        {name ? (
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
        ) : null}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Search"
        hitSlop={ICON_HIT_SLOP}
        onPress={onSearch}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
      >
        <Search size={dp(20)} color={colors.text} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
        hitSlop={ICON_HIT_SLOP}
        onPress={onNotifications}
        style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}
      >
        <Bell size={dp(20)} color={colors.text} />
        {unread > 0 ? <View style={styles.unreadDot} /> : null}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    greeting: { flex: 1, minWidth: 0, gap: dp(2) },
    welcome: { ...typography.bodySm, color: colors.textMuted },
    name: { ...typography.headlineLg, color: colors.text },
    roundButton: {
      width: sizes.iconButton,
      height: sizes.iconButton,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.iconButton,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    unreadDot: {
      position: 'absolute',
      top: dp(8),
      right: dp(9),
      width: dp(9),
      height: dp(9),
      borderRadius: radius.pill,
      backgroundColor: colors.live,
      borderWidth: 2,
      borderColor: colors.surface,
    },
  });
