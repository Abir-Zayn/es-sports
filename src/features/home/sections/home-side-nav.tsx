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
import { useTranslation, type TranslationKey } from '@/i18n';
import { dp, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { HomeUser } from './top-bar';

type Item = { label: string; labelKey: TranslationKey; icon: ComponentType<{ size?: number; color?: string }>; href?: Href };

/** In the order shown. An item without `href` is an action handled below. */
export const sideNavItems: Item[] = [
  { label: 'What’s new', labelKey: 'home.drawer.whatsNew', icon: Sparkles, href: '/whats-new' },
  { label: 'My profile', labelKey: 'home.drawer.myProfile', icon: User, href: '/profile' },
  { label: 'Leaderboards', labelKey: 'home.drawer.leaderboards', icon: ChartColumn, href: '/leaderboards' },
  { label: 'Hall of fame', labelKey: 'home.drawer.hallOfFame', icon: Award, href: '/hall-of-fame' },
  { label: 'Grounds', labelKey: 'home.drawer.grounds', icon: MapPin, href: '/grounds' },
  { label: 'Share the app', labelKey: 'home.drawer.shareApp', icon: Share2 },
  { label: 'Cricket blogs', labelKey: 'home.drawer.blogs', icon: Newspaper, href: '/blogs' },
  { label: 'Choose language', labelKey: 'home.drawer.chooseLanguage', icon: Languages, href: '/language' },
];

type Props = {
  open: boolean;
  user: Pick<HomeUser, 'initials' | 'name' | 'tone' | 'avatarUri'>;
  onClose: () => void;
  onNavigate: (href: Href) => void;
};

/** The menu behind the Home avatar: who is signed in, then the app's other places. */
export function HomeSideNav({ open, user, onClose, onNavigate }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  function choose(item: Item) {
    onClose();
    if (item.href) onNavigate(item.href);
    // A dismissed or failed share sheet needs no message.
    else void Share.share({ message: t('home.drawer.shareMessage') }).catch(() => undefined);
  }
  return (
    <SideNav open={open} onClose={onClose}>
      <View style={styles.header}>
        <InitialsAvatar label={user.initials} tone={user.tone} imageUri={user.avatarUri} size={dp(56)} />
        <Text style={styles.name} numberOfLines={2}>{user.name}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {sideNavItems.map((item) => (
          <SlideNavItem key={item.labelKey} icon={item.icon} label={t(item.labelKey)} onPress={() => choose(item)} />
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
