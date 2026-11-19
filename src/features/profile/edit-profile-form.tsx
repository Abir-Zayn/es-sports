import * as ImagePicker from 'expo-image-picker';
import { usePreventRemove, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, InitialsAvatar, SegmentedControl, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';
import { dp, sizes, useThemedStyles } from '@/theme';
import type { BattingStyle, BloodGroup, PlayingRole } from '@/types/profile';

import { BloodGroupChip } from './components/blood-group-chip';
import { PlayingRoleOption } from './components/playing-role-option';
import { ScreenHeader } from './components/screen-header';
import { createEditProfileStyles } from './edit-profile-styles';
import { battingLabels, battingShortLabel, bloodGroups, roleLabels } from './labels';
import { profileSchema, stripSeparators } from './profile-schema';
import { useProfile } from './profile-provider';

type FieldErrors = { fullName?: string; area?: string; district?: string; phone?: string; nationalId?: string };

const roles = Object.keys(roleLabels) as PlayingRole[];
const battingIds = Object.keys(battingLabels) as BattingStyle[];

/** Name, area, district, phone, National ID, blood group, photo and playing style. Saving returns to Profile; leaving with unsaved edits asks first. */
export function EditProfileForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile, saveProfile } = useProfile();
  const { t } = useTranslation();
  const styles = useThemedStyles(createEditProfileStyles);
  const battingOptions = battingIds.map((id) => ({ id, label: battingShortLabel(id) }));
  const areaRef = useRef<ComponentRef<typeof TextInput>>(null);
  const districtRef = useRef<ComponentRef<typeof TextInput>>(null);
  const phoneRef = useRef<ComponentRef<typeof TextInput>>(null);
  const nationalIdRef = useRef<ComponentRef<typeof TextInput>>(null);

  const [fullName, setFullName] = useState(profile.fullName);
  const [area, setArea] = useState(profile.area ?? '');
  const [district, setDistrict] = useState(profile.district ?? '');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | ''>(profile.bloodGroup ?? '');
  const [phone, setPhone] = useState(profile.phone ?? '');
  const [nationalId, setNationalId] = useState(profile.nationalId ?? '');
  const [role, setRole] = useState(profile.role);
  const [battingStyle, setBattingStyle] = useState(profile.battingStyle);
  const [avatarUri, setAvatarUri] = useState(profile.avatarUri);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);

  const dirty =
    fullName.trim() !== profile.fullName ||
    area.trim() !== (profile.area ?? '') ||
    district.trim() !== (profile.district ?? '') ||
    bloodGroup !== (profile.bloodGroup ?? '') ||
    stripSeparators(phone.trim()) !== (profile.phone ?? '') ||
    stripSeparators(nationalId.trim()) !== (profile.nationalId ?? '') ||
    role !== profile.role ||
    battingStyle !== profile.battingStyle ||
    avatarUri !== profile.avatarUri;

  // Covers the header button, the Android back button and the back gesture.
  const allowLeave = usePreventRemove(dirty, ({ repeat }) => {
    Alert.alert(t('profile.edit.discardTitle'), t('profile.edit.discardBody'), [
      { text: t('profile.edit.keepEditing'), style: 'cancel' },
      { text: t('profile.edit.discard'), style: 'destructive', onPress: repeat },
    ]);
  });

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function save() {
    if (inFlight.current) return;
    setFormError(null);
    const parsed = profileSchema.safeParse({ fullName, area, district, bloodGroup, phone, nationalId, role, battingStyle });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({
        fullName: flat.fullName?.[0],
        area: flat.area?.[0],
        district: flat.district?.[0],
        phone: flat.phone?.[0],
        nationalId: flat.nationalId?.[0],
      });
      return;
    }
    setErrors({});
    inFlight.current = true;
    setSaving(true);
    try {
      await saveProfile(parsed.data, avatarUri ?? null);
      allowLeave();
      router.back();
    } catch {
      setFormError(t('profile.edit.saveError'));
      setSaving(false);
      inFlight.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title={t('profile.edit.title')}
        trailing={<Button label={t('common.save')} size="compact" disabled={!dirty} loading={saving} onPress={save} />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photo}>
            <InitialsAvatar label={initialsOf(fullName.trim() || profile.fullName)} imageUri={avatarUri} size={dp(96)} accessibilityLabel={t('profile.edit.pictureA11y')} />
            <View style={styles.photoActions}>
              <Pressable accessibilityRole="button" hitSlop={sizes.hitSlop} onPress={pickPhoto} style={styles.photoButton}>
                <Text style={styles.link}>{avatarUri ? t('profile.edit.changePhoto') : t('profile.edit.addPhoto')}</Text>
              </Pressable>
              {avatarUri ? (
                <Pressable accessibilityRole="button" hitSlop={sizes.hitSlop} onPress={() => setAvatarUri(undefined)} style={styles.photoButton}>
                  <Text style={styles.remove}>{t('profile.edit.removePhoto')}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          {formError ? (
            <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">
              {formError}
            </Text>
          ) : null}

          <View style={styles.fields}>
            <TextField
              label={t('profile.edit.fullName')}
              value={fullName}
              editable={!saving}
              onChangeText={setFullName}
              error={errors.fullName}
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              onSubmitEditing={() => areaRef.current?.focus()}
            />
            <TextField
              ref={areaRef}
              label={t('profile.edit.area')}
              value={area}
              editable={!saving}
              onChangeText={setArea}
              error={errors.area}
              placeholder={t('profile.edit.areaPlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => districtRef.current?.focus()}
            />
            <TextField
              ref={districtRef}
              label={t('profile.edit.district')}
              value={district}
              editable={!saving}
              onChangeText={setDistrict}
              error={errors.district}
              placeholder={t('profile.edit.districtPlaceholder')}
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <TextField
              ref={phoneRef}
              label={t('profile.edit.phone')}
              value={phone}
              editable={!saving}
              onChangeText={setPhone}
              error={errors.phone}
              placeholder="01XXXXXXXXX"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
              maxLength={18}
              returnKeyType="next"
              onSubmitEditing={() => nationalIdRef.current?.focus()}
            />
            <View style={styles.field}>
              <TextField
                ref={nationalIdRef}
                label={t('profile.edit.nid')}
                value={nationalId}
                editable={!saving}
                onChangeText={setNationalId}
                error={errors.nationalId}
                placeholder={t('profile.edit.nidPlaceholder')}
                keyboardType="number-pad"
                autoComplete="off"
                maxLength={21}
                returnKeyType="done"
              />
              <Text variant="caption" muted>
                {t('profile.edit.nidHint')}
              </Text>
            </View>
            <View style={styles.readOnly}>
              <TextField label={t('profile.personal.email')} value={session?.user.email ?? ''} editable={false} />
              <Text variant="caption" muted>
                {t('profile.edit.emailHint')}
              </Text>
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              {t('profile.edit.bloodGroup')}
            </Text>
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={t('profile.edit.bloodGroup')}>
              {bloodGroups.map((id) => (
                <BloodGroupChip key={id} id={id} selected={id === bloodGroup} onPress={() => setBloodGroup(id === bloodGroup ? '' : id)} />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              {t('profile.edit.playingRole')}
            </Text>
            <View style={styles.roles} accessibilityRole="radiogroup" accessibilityLabel={t('profile.edit.playingRole')}>
              {roles.map((id) => (
                <View key={id} style={styles.roleCell}>
                  <PlayingRoleOption role={id} selected={id === role} onPress={() => setRole(id)} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              {t('profile.edit.battingStyle')}
            </Text>
            <SegmentedControl options={battingOptions} selected={battingStyle} onSelect={setBattingStyle} height={dp(44)} accessibilityLabel={t('profile.edit.battingStyle')} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
