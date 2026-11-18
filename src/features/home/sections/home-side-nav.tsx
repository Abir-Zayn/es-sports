import type { Href } from 'expo-router';
import Award from 'lucide-react-native/icons/award';
import ChartColumn from 'lucide-react-native/icons/chart-column';
import Languages from 'lucide-react-native/icons/languages';
import MapPin from 'lucide-react-native/icons/map-pin';
import Newspaper from 'lucide-react-native/icons/newspaper';
import Share2 from 'lucide-react-native/icons/share-2';
import Sparkles from 'lucide-react-native/icons/sparkles';
import User from 'lucide-react-native/icons/user';
import type { ComponentType } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';

import { SideNav } from '@/components/navigation/side-nav';
import { SlideNavItem } from '@/components/navigation/slide-nav-item';
import { InitialsAvatar, Text } from '@/components/ui';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { HomeUser } from '../sample-data';

type Item = { label: string; icon: ComponentType<{ size?: number; color?: string }>; href?: Href };

/** In the order shown. An item without `href` is an action handled below. */
export const sideNavItems: Item[] = [
  { label: 'What’s new', icon: Sparkles, href: '/whats-new' },
  { label: 'My profile', icon: User, href: '/profile' },
  { label: 'Leaderboards', icon: ChartColumn, href: '/leaderboards' },
  { label: 'Hall of fame', icon: Award, href: '/hall-of-fame' },
  { label: 'Grounds', icon: MapPin, href: '/grounds' },
  { label: 'Share the app', icon: Share2 },
  { label: 'Cricket blogs', icon: Newspaper, href: '/blogs' },
  { label: 'Choose language', icon: Languages, href: '/language' },
];

const SHARE_MESSAGE = 'I score and follow local cricket on esSports. Join me!';

type Props = {
  open: boolean;
  user: Pick<HomeUser, 'initials' | 'name' | 'tone' | 'avatarUri'>;
  onClose: () => void;
  onNavigate: (href: Href) => void;
};

/** The menu behind the Home avatar: who is signed in, then the app's other places. */
export function HomeSideNav({ open, user, onClose, onNavigate }: Props) {
  const styles = useThemedStyles(createStyles);
  function choose(item: Item) {
    onClose();
    if (item.href) onNavigate(item.href);
    // A dismissed or failed share sheet needs no message.
    else void Share.share({ message: SHARE_MESSAGE }).catch(() => undefined);
  }
  return (
    <SideNav open={open} onClose={onClose}>
      <View style={styles.header}>
        <InitialsAvatar label={user.initials} tone={user.tone} imageUri={user.avatarUri} size={dp(56)} />
        <Text style={styles.name} numberOfLines={2}>{user.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {sideNavItems.map((item) => (
          <SlideNavItem key={item.label} icon={item.icon} label={item.label} onPress={() => choose(item)} />
        ))}
      </ScrollView>
    </SideNav>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    header: {
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    name: { ...typography.headlineMd, color: colors.text },
    list: { gap: spacing.xs },
  });
