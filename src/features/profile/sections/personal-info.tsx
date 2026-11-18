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
const ADD = 'Add';

/** Email, phone, blood group, area, district and National ID. The ID is shown masked: only the last 4 digits. */
export function PersonalInfo({ profile, email, onEdit }: Props) {
  const rows: [string, string | undefined][] = [
    ['Phone', profile.phone],
    ['Blood group', profile.bloodGroup],
    ['Area', profile.area],
    ['District', profile.district],
    ['National ID', profile.nationalId ? maskId(profile.nationalId) : undefined],
  ];
  return (
    <Section>
      <SectionHeader title="Personal info" action="Edit" onAction={onEdit} />
      <View style={styles.body}>
        <SettingsGroup>
          {/* Email comes from sign-in and is not editable here. */}
          <SettingsRow label="Email" value={email || NOT_ADDED} />
          {rows.map(([label, value]) => (
            // A missing field opens the edit form right where the gap is.
            <SettingsRow key={label} label={label} value={value || ADD} onPress={value ? undefined : onEdit} />
          ))}
        </SettingsGroup>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: sizes.gutter },
});
