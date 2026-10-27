import { createContext, use, useCallback, useMemo, useState, type ReactNode } from 'react';

import type { PlayerProfile, ProfileData } from '@/types/profile';

import type { ProfileInput } from './profile-schema';
import { sampleProfile } from './sample-data';

type ProfileContextValue = ProfileData & {
  /** Saves edits. `avatarUri: null` removes the picture, `undefined` keeps it. */
  saveProfile: (input: ProfileInput, avatarUri?: string | null) => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Holds the signed-in player's profile in memory so Profile and Edit profile stay in sync. Swap `saveProfile` for a Supabase upsert later. */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ProfileData>(sampleProfile);

  const saveProfile = useCallback(async (input: ProfileInput, avatarUri?: string | null) => {
    setData((current) => {
      const next: PlayerProfile = {
        ...current.profile,
        ...input,
        area: input.area || undefined,
        district: input.district || undefined,
        bloodGroup: input.bloodGroup || undefined,
        phone: input.phone || undefined,
        nationalId: input.nationalId || undefined,
        avatarUri: avatarUri === undefined ? current.profile.avatarUri : (avatarUri ?? undefined),
      };
      return { ...current, profile: next };
    });
  }, []);

  const value = useMemo(() => ({ ...data, saveProfile }), [data, saveProfile]);
  return <ProfileContext value={value}>{children}</ProfileContext>;
}

export function useProfile() {
  const value = use(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
