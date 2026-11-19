import { t } from '@/i18n';
import { supabase } from '@/lib/supabase';

import { providerProfileFromMetadata } from './provider-profile';
import type { LinkedAccountsResult } from '../types';

/** Which sign-in methods the current user has, and what Google shares if it is linked. */
export async function loadLinkedAccounts(): Promise<LinkedAccountsResult> {
  try {
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error || !data) return { ok: false, message: t('auth.err.linkedAccountsFailed') };
    const google = data.identities.find((identity) => identity.provider === 'google');
    return {
      ok: true,
      accounts: {
        hasEmail: data.identities.some((identity) => identity.provider === 'email'),
        google: google ? providerProfileFromMetadata(google.identity_data) : null,
      },
    };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
