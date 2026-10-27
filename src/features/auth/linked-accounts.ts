import { supabase } from '@/lib/supabase';

import { providerProfileFromMetadata, type ProviderProfile } from './provider-profile';

export type LinkedAccounts = {
  /** Signed up with an email and password. */
  hasEmail: boolean;
  /** The linked Google account's name and photo, or null when Google is not linked. */
  google: ProviderProfile | null;
};

export type LinkedAccountsResult = { ok: true; accounts: LinkedAccounts } | { ok: false; message: string };

/** Which sign-in methods the current user has, and what Google shares if it is linked. */
export async function loadLinkedAccounts(): Promise<LinkedAccountsResult> {
  try {
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error || !data) return { ok: false, message: 'Couldn’t load your linked accounts.' };
    const google = data.identities.find((identity) => identity.provider === 'google');
    return {
      ok: true,
      accounts: {
        hasEmail: data.identities.some((identity) => identity.provider === 'email'),
        google: google ? providerProfileFromMetadata(google.identity_data) : null,
      },
    };
  } catch {
    return { ok: false, message: 'Couldn’t connect. Check your connection and try again.' };
  }
}
