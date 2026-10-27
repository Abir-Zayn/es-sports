import { providerProfileFromMetadata } from '@/features/auth/provider-profile';
import { supabase } from '@/lib/supabase';
import type { BattingStyle, BloodGroup, PlayingRole } from '@/types/profile';

const AVATAR_BUCKET = 'avatars';

/** A profile as stored: every optional value is null when never set. Public part in `profiles`, private part in `profile_private`. */
export type StoredProfile = {
  fullName: string | null;
  avatarUrl: string | null;
  area: string | null;
  district: string | null;
  role: PlayingRole | null;
  battingStyle: BattingStyle | null;
  phone: string | null;
  nationalId: string | null;
  bloodGroup: BloodGroup | null;
};

type ProfileRow = {
  full_name: string | null;
  avatar_url: string | null;
  area: string | null;
  district: string | null;
  role: PlayingRole | null;
  batting_style: BattingStyle | null;
};

type PrivateRow = { phone: string | null; national_id: string | null; blood_group: BloodGroup | null };

const PROFILE_COLUMNS = 'full_name, avatar_url, area, district, role, batting_style';
const PRIVATE_COLUMNS = 'phone, national_id, blood_group';

export function toStoredProfile(row: ProfileRow, priv: PrivateRow | null): StoredProfile {
  return {
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    area: row.area,
    district: row.district,
    role: row.role,
    battingStyle: row.batting_style,
    phone: priv?.phone ?? null,
    nationalId: priv?.national_id ?? null,
    bloodGroup: priv?.blood_group ?? null,
  };
}

/** Splits a partial update into the columns of each table. A table with nothing to change is left out. */
export function toDbPatch(patch: Partial<StoredProfile>): { profile: Partial<ProfileRow>; private: Partial<PrivateRow> } {
  const profile: Partial<ProfileRow> = {};
  if (patch.fullName !== undefined) profile.full_name = patch.fullName;
  if (patch.avatarUrl !== undefined) profile.avatar_url = patch.avatarUrl;
  if (patch.area !== undefined) profile.area = patch.area;
  if (patch.district !== undefined) profile.district = patch.district;
  if (patch.role !== undefined) profile.role = patch.role;
  if (patch.battingStyle !== undefined) profile.batting_style = patch.battingStyle;

  const priv: Partial<PrivateRow> = {};
  if (patch.phone !== undefined) priv.phone = patch.phone;
  if (patch.nationalId !== undefined) priv.national_id = patch.nationalId;
  if (patch.bloodGroup !== undefined) priv.blood_group = patch.bloodGroup;
  return { profile, private: priv };
}

type UserRef = { id: string; user_metadata?: Record<string, unknown> };

/**
 * Loads the signed-in user's profile. If there is no row yet (an account made before the profiles migration, or a
 * failed signup trigger) it creates one, pre-filled once from the sign-in provider's name and photo.
 */
export async function fetchProfile(user: UserRef): Promise<StoredProfile> {
  const [profile, priv] = await Promise.all([
    supabase.from('profiles').select(PROFILE_COLUMNS).eq('id', user.id).maybeSingle<ProfileRow>(),
    supabase.from('profile_private').select(PRIVATE_COLUMNS).eq('id', user.id).maybeSingle<PrivateRow>(),
  ]);
  if (profile.error) throw profile.error;
  if (priv.error) throw priv.error;
  if (profile.data) return toStoredProfile(profile.data, priv.data);

  const fromProvider = providerProfileFromMetadata(user.user_metadata);
  const created = { id: user.id, full_name: fromProvider.fullName ?? null, avatar_url: fromProvider.avatarUrl ?? null };
  const { error } = await supabase.from('profiles').upsert(created, { onConflict: 'id', ignoreDuplicates: true });
  if (error) throw error;
  return toStoredProfile(
    { full_name: created.full_name, avatar_url: created.avatar_url, area: null, district: null, role: null, batting_style: null },
    priv.data,
  );
}

/** Writes only the fields given. The private row is created on first write. */
export async function updateProfile(userId: string, patch: Partial<StoredProfile>): Promise<void> {
  const db = toDbPatch(patch);
  if (Object.keys(db.profile).length > 0) {
    const { error } = await supabase.from('profiles').upsert({ id: userId, ...db.profile }, { onConflict: 'id' });
    if (error) throw error;
  }
  if (Object.keys(db.private).length > 0) {
    const { error } = await supabase.from('profile_private').upsert({ id: userId, ...db.private }, { onConflict: 'id' });
    if (error) throw error;
  }
}

/** Uploads a picked photo to the user's own folder and returns its public URL. Older uploads are removed. */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const response = await fetch(localUri);
  const bytes = await response.arrayBuffer();
  // A new name per upload, so the app never shows a cached copy of the old photo.
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(AVATAR_BUCKET).upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw error;

  // Best effort: a failed cleanup must not fail the save.
  try {
    const { data: files } = await supabase.storage.from(AVATAR_BUCKET).list(userId);
    const stale = (files ?? []).map((file) => `${userId}/${file.name}`).filter((name) => name !== path);
    if (stale.length > 0) await supabase.storage.from(AVATAR_BUCKET).remove(stale);
  } catch {}

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** True for a picked photo on the device, false for a hosted URL such as an uploaded or Google photo. */
export const isLocalImage = (uri: string) => !/^https?:\/\//.test(uri);
