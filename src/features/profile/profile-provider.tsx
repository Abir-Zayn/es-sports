import { createContext, use, useCallback, useEffect, useEffectEvent, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { useAuth } from '@/features/auth/auth-provider';
import type { ProviderProfile } from '@/features/auth/provider-profile';
import { addPerformances, toBattingStats, toBowlingStats } from '@/lib/career-stats';
import type { PlayerProfile, ProfileData } from '@/types/profile';

import type { ProfileInput } from './profile-schema';
import {
  deleteAvatar,
  fetchProfile,
  isLocalImage,
  updateProfile,
  uploadAvatar,
  type StoredProfile,
} from './profile-repository';
import { careerOf, useLedger } from './career-ledger';
import { sampleCareer, sampleProfile } from './sample-data';

type Status = 'loading' | 'ready' | 'error';

type LoadResult = { userId: string; stored: StoredProfile } | { userId: string; failed: true };

/** `fill-empty` only fills what is still blank. `overwrite` replaces the current name and photo. */
export type ImportMode = 'fill-empty' | 'overwrite';

type ProfileContextValue = ProfileData & {
  status: Status;
  reload: () => void;
  /** Saves edits. A picked photo on the device is uploaded; `null` removes the photo. Never touches the auth session. */
  saveProfile: (input: ProfileInput, avatarUri: string | null) => Promise<void>;
  /** Copies a provider's name and photo into the profile. Resolves true when something changed. */
  importFromProvider: (provider: ProviderProfile, mode: ImportMode) => Promise<boolean>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

const emptyStored: StoredProfile = {
  fullName: null,
  avatarUrl: null,
  area: null,
  district: null,
  role: null,
  battingStyle: null,
  phone: null,
  nationalId: null,
  bloodGroup: null,
};

function toPlayerProfile(userId: string, email: string | undefined, stored: StoredProfile | null): PlayerProfile {
  return {
    id: userId,
    // A profile that never had a name shows the email's first part until the player picks one.
    fullName: stored?.fullName ?? email?.split('@')[0] ?? 'Player',
    area: stored?.area ?? undefined,
    district: stored?.district ?? undefined,
    bloodGroup: stored?.bloodGroup ?? undefined,
    phone: stored?.phone ?? undefined,
    nationalId: stored?.nationalId ?? undefined,
    role: stored?.role ?? 'all-rounder',
    battingStyle: stored?.battingStyle ?? 'right',
    avatarUri: stored?.avatarUrl ?? undefined,
  };
}

/**
 * Holds the signed-in player's profile, stored in Supabase. The name and photo are copied from Google only once,
 * at sign-up; after that they belong to the player and are edited here without touching the auth session.
 * Stats, teams and recent matches are still sample data.
 */
export function ProfileProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const user = session?.user;
  const userId = user?.id;
  const [result, setResult] = useState<LoadResult | null>(null);
  const [attempt, setAttempt] = useState(0);

  // A result belongs to one user. After a different user signs in, the old one no longer counts.
  const current = result && result.userId === userId ? result : null;
  const stored = current && 'stored' in current ? current.stored : null;
  const status: Status = current ? ('stored' in current ? 'ready' : 'error') : 'loading';

  // Reads the latest session without re-running the load on every token refresh.
  const load = useEffectEvent(() => (user ? fetchProfile(user) : Promise.resolve(null)));

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    load()
      .then((profile) => {
        if (!cancelled && profile) setResult({ userId, stored: profile });
      })
      .catch(() => {
        if (!cancelled) setResult({ userId, failed: true });
      });
    return () => {
      cancelled = true;
    };
  }, [userId, attempt]);

  // Back from the background the photo or name may have changed on another device: refresh quietly, with no spinner.
  useEffect(() => {
    if (!userId) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      load().then((profile) => {
        if (profile) setResult({ userId, stored: profile });
      }).catch(() => {});
    });
    return () => subscription.remove();
  }, [userId]);

  const reload = useCallback(() => {
    setResult(null);
    setAttempt((n) => n + 1);
  }, []);

  const write = useCallback(
    async (patch: Partial<StoredProfile>) => {
      if (!userId) throw new Error('Not signed in');
      await updateProfile(userId, patch);
      setResult((previous) => ({
        userId,
        stored: { ...(previous && 'stored' in previous ? previous.stored : emptyStored), ...patch },
      }));
    },
    [userId],
  );

  const saveProfile = useCallback(
    async (input: ProfileInput, avatarUri: string | null) => {
      if (!userId) throw new Error('Not signed in');
      let avatarUrl = avatarUri;
      if (avatarUri && isLocalImage(avatarUri)) {
        avatarUrl = await uploadAvatar(userId, avatarUri);
      } else if (!avatarUri && stored?.avatarUrl) {
        await deleteAvatar(userId);
      }
      await write({
        fullName: input.fullName,
        area: input.area || null,
        district: input.district || null,
        bloodGroup: input.bloodGroup || null,
        phone: input.phone || null,
        nationalId: input.nationalId || null,
        role: input.role,
        battingStyle: input.battingStyle,
        avatarUrl,
      });
    },
    [userId, write, stored?.avatarUrl],
  );

  const importFromProvider = useCallback(
    async (provider: ProviderProfile, mode: ImportMode) => {
      // Until the profile has loaded we cannot tell what is blank, so never guess.
      if (!stored) return false;
      const patch: Partial<StoredProfile> = {};
      if (provider.fullName && (mode === 'overwrite' || !stored.fullName)) patch.fullName = provider.fullName;
      if (provider.avatarUrl && (mode === 'overwrite' || !stored.avatarUrl)) {
        patch.avatarUrl = provider.avatarUrl;
        if (userId && stored.avatarUrl) await deleteAvatar(userId);
      }
      if (Object.keys(patch).length === 0) return false;
      await write(patch);
      return true;
    },
    [stored, write, userId],
  );

  const ledger = useLedger();
  const career = useMemo(() => {
    // Matches finished on this device add to the career; with none, the figures stay as they were.
    const mine = careerOf(ledger, userId ?? 'me');
    if (mine.performances.length === 0) return null;
    const totals = addPerformances(sampleCareer, mine.performances);
    return { batting: toBattingStats(totals), bowling: toBowlingStats(totals), recent: [...mine.recent, ...sampleProfile.recent] };
  }, [ledger, userId]);

  const value = useMemo<ProfileContextValue>(
    () => ({
      ...sampleProfile,
      ...career,
      profile: toPlayerProfile(userId ?? 'me', user?.email, stored),
      status,
      reload,
      saveProfile,
      importFromProvider,
    }),
    [userId, user?.email, stored, status, reload, saveProfile, importFromProvider, career],
  );
  return <ProfileContext value={value}>{children}</ProfileContext>;
}

export function useProfile() {
  const value = use(ProfileContext);
  if (!value) throw new Error('useProfile must be used inside ProfileProvider');
  return value;
}
