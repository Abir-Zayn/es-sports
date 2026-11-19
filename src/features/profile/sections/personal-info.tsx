import { StyleSheet, View } from 'react-native';

import { Section, SectionHeader, SettingsGroup, SettingsRow } from '@/components/ui';
import { useTranslation, type TranslationKey } from '@/i18n';
import { maskId } from '@/lib/mask-id';
import { sizes } from '@/theme';
import type { PlayerProfile } from '@/types/profile';

type Props = {
  profile: PlayerProfile;
  /** The sign-in email, which lives on the auth session rather than the profile. */
  email?: string;
  onEdit: () => void;
};

/** Email, phone, blood group, area, district and National ID. The ID is shown masked: only the last 4 digits. */
export function PersonalInfo({ profile, email, onEdit }: Props) {
  const { t } = useTranslation();
  const rows: [TranslationKey, string | undefined][] = [
    ['profile.personal.phone', profile.phone],
    ['profile.personal.bloodGroup', profile.bloodGroup],
    ['profile.personal.area', profile.area],
    ['profile.personal.district', profile.district],
    ['profile.personal.nationalId', profile.nationalId ? maskId(profile.nationalId) : undefined],
  ];
  return (
    <Section>
      <SectionHeader title={t('profile.personal.title')} action={t('common.edit')} onAction={onEdit} />
      <View style={styles.body}>
        <SettingsGroup>
          {/* Email comes from sign-in and is not editable here. */}
          <SettingsRow label={t('profile.personal.email')} value={email || t('profile.personal.notAdded')} />
          {rows.map(([labelKey, value]) => (
            // A missing field opens the edit form right where the gap is.
            <SettingsRow key={labelKey} label={t(labelKey)} value={value || t('profile.personal.add')} onPress={value ? undefined : onEdit} />
          ))}
        </SettingsGroup>
      </View>
    </Section>
  );
}

const styles = StyleSheet.create({
  body: { paddingHorizontal: sizes.gutter },
});
