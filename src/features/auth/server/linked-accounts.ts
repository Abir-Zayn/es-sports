import { supabase } from '@/lib/supabase';

import { providerProfileFromMetadata } from '../utils/provider-profile';
import type { LinkedAccountsResult, ProviderProfile } from '../types';

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
