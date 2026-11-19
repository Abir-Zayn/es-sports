import Pencil from 'lucide-react-native/icons/pencil';
import Settings from 'lucide-react-native/icons/settings';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { PlayerProfile } from '@/types/profile';

import { CopyIdButton } from '../components/copy-id-button';
import { battingLabel, roleLabel } from '../labels';

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
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const place = [profile.area, profile.district].filter(Boolean).join(', ');
  const pills = [roleLabel(profile.role), battingLabel(profile.battingStyle)].filter(Boolean);
  return (
    <View style={styles.wrap}>
      <View style={styles.bar}>
        <Text variant="title" accessibilityRole="header">
          {t('profile.title')}
        </Text>
        <View style={styles.actions}>
          <AppIconTile
            icon={Pencil}
            backgroundColor={colors.surface}
            elevated
            accessibilityLabel={t('profile.editA11y')}
            onPress={onEdit}
          />
          <AppIconTile
            icon={Settings}
            backgroundColor={colors.surface}
            elevated
            accessibilityLabel={t('profile.settingsA11y')}
            onPress={onSettings}
          />
        </View>
      </View>
      <View style={styles.identity}>
        <InitialsAvatar
          label={initialsOf(profile.fullName)}
          imageUri={profile.avatarUri}
          size={dp(72)}
          accessibilityLabel={t('profile.pictureA11y', { name: profile.fullName })}
        />
        <View style={styles.names}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.fullName}</Text>
            {userId ? <CopyIdButton userId={userId} /> : null}
          </View>
          {place ? <Text variant="bodySm" muted>{place}</Text> : null}
          <View style={styles.pills} accessible accessibilityLabel={t('profile.playingStyleA11y', { style: pills.join(', ') })}>
            {pills.map((label) => (
              <View key={label} style={styles.pill}>
                <Text style={styles.pillLabel}>{label}</Text>
              </View>
            ))}
          </View>
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
    pills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
    pill: { paddingVertical: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
    pillLabel: { ...typography.labelSm, color: colors.textMuted },
  });
