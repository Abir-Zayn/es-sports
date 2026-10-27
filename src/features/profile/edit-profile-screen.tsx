import * as ImagePicker from 'expo-image-picker';
import { usePreventRemove, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, InitialsAvatar, SegmentedControl, Text, TextField } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { initialsOf } from '@/lib/initials';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';
import type { BattingStyle, BloodGroup, PlayingRole } from '@/types/profile';

import { PlayingRoleOption } from './components/playing-role-option';
import { ScreenHeader } from './components/screen-header';
import { battingLabels, bloodGroups, roleLabels } from './labels';
import { profileSchema, stripSeparators } from './profile-schema';
import { useProfile } from './profile-provider';

type FieldErrors = { fullName?: string; area?: string; district?: string; phone?: string; nationalId?: string };

const roles = Object.keys(roleLabels) as PlayingRole[];
const battingOptions = (Object.keys(battingLabels) as BattingStyle[]).map((id) => ({
  id,
  label: id === 'right' ? 'Right-hand' : 'Left-hand',
}));

/** Name, area, district, phone, National ID, blood group, photo and playing style. Saving returns to Profile; leaving with unsaved edits asks first. */
function EditProfileForm() {
  const router = useRouter();
  const { session } = useAuth();
  const { profile, saveProfile } = useProfile();
  const styles = useThemedStyles(createStyles);
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
    Alert.alert('Discard changes?', 'Your edits have not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: repeat },
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
      setFormError('Couldn’t save your profile. Try again.');
      setSaving(false);
      inFlight.current = false;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader
        title="Edit Profile"
        trailing={<Button label="Save" size="compact" disabled={!dirty} loading={saving} onPress={save} />}
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.photo}>
            <InitialsAvatar label={initialsOf(fullName.trim() || profile.fullName)} imageUri={avatarUri} size={96} accessibilityLabel="Profile picture" />
            <View style={styles.photoActions}>
              <Pressable accessibilityRole="button" hitSlop={sizes.hitSlop} onPress={pickPhoto} style={styles.photoButton}>
                <Text style={styles.link}>{avatarUri ? 'Change photo' : 'Add photo'}</Text>
              </Pressable>
              {avatarUri ? (
                <Pressable accessibilityRole="button" hitSlop={sizes.hitSlop} onPress={() => setAvatarUri(undefined)} style={styles.photoButton}>
                  <Text style={styles.remove}>Remove</Text>
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
              label="Full name"
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
              label="Area"
              value={area}
              editable={!saving}
              onChangeText={setArea}
              error={errors.area}
              placeholder="e.g. Halishahar"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => districtRef.current?.focus()}
            />
            <TextField
              ref={districtRef}
              label="District"
              value={district}
              editable={!saving}
              onChangeText={setDistrict}
              error={errors.district}
              placeholder="e.g. Chattogram"
              autoCapitalize="words"
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
            />
            <TextField
              ref={phoneRef}
              label="Phone number"
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
                label="National ID number"
                value={nationalId}
                editable={!saving}
                onChangeText={setNationalId}
                error={errors.nationalId}
                placeholder="10, 13 or 17 digits"
                keyboardType="number-pad"
                autoComplete="off"
                maxLength={21}
                returnKeyType="done"
              />
              <Text variant="caption" muted>
                Private. Only you can see your full number.
              </Text>
            </View>
            <View style={styles.readOnly}>
              <TextField label="Email" value={session?.user.email ?? ''} editable={false} />
              <Text variant="caption" muted>
                Change your email in Settings.
              </Text>
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              Blood group
            </Text>
            <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Blood group">
              {bloodGroups.map((id) => (
                <BloodGroupChip key={id} id={id} selected={id === bloodGroup} onPress={() => setBloodGroup(id === bloodGroup ? '' : id)} />
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              Playing role
            </Text>
            <View style={styles.roles} accessibilityRole="radiogroup" accessibilityLabel="Playing role">
              {roles.map((id) => (
                <View key={id} style={styles.roleCell}>
                  <PlayingRoleOption role={id} selected={id === role} onPress={() => setRole(id)} />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.group}>
            <Text variant="caption" muted>
              Batting style
            </Text>
            <SegmentedControl options={battingOptions} selected={battingStyle} onSelect={setBattingStyle} height={44} accessibilityLabel="Batting style" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/** Waits for the stored profile, so the form never starts from placeholder values. */
export function EditProfileScreen() {
  const { status, reload } = useProfile();
  const styles = useThemedStyles(createStyles);
  if (status === 'ready') return <EditProfileForm />;
  return (
    <SafeAreaView style={styles.safe}>
      <ScreenHeader title="Edit Profile" />
      <View style={styles.centered}>
        {status === 'loading' ? (
          <ActivityIndicator accessibilityLabel="Loading your profile" />
        ) : (
          <>
            <Text muted>Couldn’t load your profile.</Text>
            <Button label="Try again" size="compact" onPress={reload} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function BloodGroupChip({ id, selected, onPress }: { id: BloodGroup; selected: boolean; onPress: () => void }) {
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={id}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipLabel, selected && styles.chipLabelOn]}>{id}</Text>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl },
    photo: { alignItems: 'center', gap: spacing.sm },
    photoActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    photoButton: { minHeight: 44, justifyContent: 'center' },
    remove: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.textMuted },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter },
    link: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.link },
    error: { color: colors.danger },
    fields: { gap: spacing.lg },
    field: { gap: spacing.xs },
    readOnly: { gap: spacing.xs, opacity: 0.7 },
    group: { gap: spacing.sm },
    roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    // Two per row: half the width minus half the gap.
    roleCell: { flexBasis: '48.5%', flexGrow: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      minWidth: 64,
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipLabel: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    chipLabelOn: { color: colors.primaryText },
  });
