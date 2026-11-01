import Settings from 'lucide-react-native/icons/settings';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, Button, InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { PlayerProfile } from '@/types/profile';

import { CopyIdButton } from '../components/copy-id-button';
import { roleLabels } from '../labels';

type Props = {
  profile: PlayerProfile;
  /** The account's id, copied by the button beside the name. Hidden until the session is known. */
  userId?: string;
  onSettings: () => void;
  onEdit: () => void;
};

/** Title bar with a settings button, then the player's avatar, name and an edit button. */
export function ProfileHeader({ profile, userId, onSettings, onEdit }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const place = [profile.area, profile.district].filter(Boolean).join(', ');
  const meta = [roleLabels[profile.role], place].filter(Boolean).join(' · ');
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Text variant="title" accessibilityRole="header">
          Profile
        </Text>
        <AppIconTile
          icon={Settings}
          size={44}
          borderRadius={22}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          accessibilityLabel="Settings"
          onPress={onSettings}
        />
      </View>
      <View style={styles.identity}>
        <InitialsAvatar
          label={initialsOf(profile.fullName)}
          imageUri={profile.avatarUri}
          size={96}
          accessibilityLabel={`${profile.fullName} profile picture`}
        />
        <View style={styles.names}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.fullName}</Text>
            {userId ? <CopyIdButton userId={userId} /> : null}
          </View>
          <Text muted>{meta}</Text>
        </View>
        <Button label="Edit profile" variant="secondary" size="compact" onPress={onEdit} />
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.xl },
    bar: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    identity: { alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter },
    names: { alignItems: 'center', gap: 2 },
    nameRow: { maxWidth: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
    name: { flexShrink: 1, fontSize: 24, lineHeight: 30, fontWeight: '700', textAlign: 'center', color: colors.text },
  });
