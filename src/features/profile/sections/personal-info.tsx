import { StyleSheet, View } from 'react-native';

import { Section, SectionHeader, SettingsGroup, SettingsRow } from '@/components/ui';
import { maskId } from '@/lib/mask-id';
import { sizes } from '@/theme';
import type { PlayerProfile } from '@/types/profile';

type Props = {
  profile: PlayerProfile;
  /** The sign-in email, which lives on the auth session rather than the profile. */
  email?: string;
  onEdit: () => void;
};

const NOT_ADDED = 'Not added';

/** Email, phone, blood group, area, district and National ID. The ID is shown masked: only the last 4 digits. */
export function PersonalInfo({ profile, email, onEdit }: Props) {
  return (
    <Section>
      <SectionHeader title="Personal Info" action="Edit" onAction={onEdit} />
      <View style={styles.body}>
        <SettingsGroup>
          <SettingsRow label="Email" value={email || NOT_ADDED} />
          <SettingsRow label="Phone" value={profile.phone || NOT_ADDED} />
          <SettingsRow label="Blood group" value={profile.bloodGroup || NOT_ADDED} />
          <SettingsRow label="Area" value={profile.area || NOT_ADDED} />
          <SettingsRow label="District" value={profile.district || NOT_ADDED} />
          <SettingsRow label="National ID" value={profile.nationalId ? maskId(profile.nationalId) : NOT_ADDED} />
        </SettingsGroup>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: sizes.gutter },
});
