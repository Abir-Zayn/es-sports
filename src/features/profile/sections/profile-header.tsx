import Pencil from 'lucide-react-native/icons/pencil';
import Settings from 'lucide-react-native/icons/settings';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
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

/** Title bar with edit and settings actions, followed by the player's identity. */
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
        <View style={styles.actions}>
          <AppIconTile
            icon={Pencil}
            backgroundColor={colors.surface}
            elevated
            accessibilityLabel="Edit profile"
            onPress={onEdit}
          />
          <AppIconTile
            icon={Settings}
            backgroundColor={colors.surface}
            elevated
            accessibilityLabel="Settings"
            onPress={onSettings}
          />
        </View>
      </View>
      <View style={styles.identity}>
        <InitialsAvatar
          label={initialsOf(profile.fullName)}
          imageUri={profile.avatarUri}
          size={dp(72)}
          accessibilityLabel={`${profile.fullName} profile picture`}
        />
        <View style={styles.names}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.fullName}</Text>
            {userId ? <CopyIdButton userId={userId} /> : null}
          </View>
          <Text variant="bodySm" muted>{meta}</Text>
        </View>
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    wrap: { gap: spacing.lg },
    bar: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    actions: { flexDirection: 'row', gap: spacing.sm },
    identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter },
    names: { flex: 1, gap: spacing.xs },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { ...typography.headlineLg, flexShrink: 1, color: colors.text },
  });
