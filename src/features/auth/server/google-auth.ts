import Constants, { ExecutionEnvironment } from 'expo-constants';

import { t } from '@/i18n';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase';

import { authErrorMessage } from '../utils/auth-errors';
import type { GoogleAuthResult } from '../types';

/** `cancelled` means the user dismissed the account picker; show no error for it. */
type TokenResult = { ok: true; idToken: string } | { ok: false; cancelled?: boolean; message: string };

type GoogleSigninModule = typeof import('@react-native-google-signin/google-signin');

/**
 * Loads the native Google module on first use. Expo Go and builds made before the library was added have no native
 * side, and importing it at the top of the file would crash the Login and Settings screens. Loading here keeps them working.
 */
function loadGoogleSignin(): GoogleSigninModule | null {
  // Expo Go only ships Expo's own modules, so skip the load instead of logging a native-module error.
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be a runtime require so a missing native module throws here, not at import
    return require('@react-native-google-signin/google-signin') as GoogleSigninModule;
  } catch {
    return null;
  }
}

let configured = false;

/** Development-only trace for diagnosing sign-in. Never log tokens or emails. Release builds strip console calls. */
function debug(stage: string, details?: Record<string, unknown>) {
  if (__DEV__) console.log(`[google-signin] ${stage}`, details ?? '');
}

/** Shows the native Android account picker and returns the signed-in account's Google ID token. */
async function pickGoogleAccount(fallback: string): Promise<TokenResult> {
  const webClientId = env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  if (!webClientId) return { ok: false, message: t('auth.err.googleNotSetUp') };

  const native = loadGoogleSignin();
  if (!native) return { ok: false, message: t('auth.err.googleNeedsBuild') };
  const { GoogleSignin, isErrorWithCode, statusCodes } = native;

  try {
    debug('start', { webClientId, packageHint: 'com.essports.app', configured });
    if (!configured) {
      // The ID token is issued for the Web client, which is the one Supabase's Google provider checks.
      GoogleSignin.configure({ webClientId });
      configured = true;
    }
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    // Forget the previous account so the picker always opens and a different account can be chosen.
    await GoogleSignin.signOut().catch(() => {});

    const response = await GoogleSignin.signIn();
    debug('picker closed', { type: response.type, hasIdToken: response.type === 'success' && !!response.data.idToken });
    if (response.type !== 'success') return { ok: false, cancelled: true, message: '' };
    if (!response.data.idToken) return { ok: false, message: fallback };
    return { ok: true, idToken: response.data.idToken };
  } catch (error) {
    debug('native error', {
      code: isErrorWithCode(error) ? error.code : undefined,
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
    });
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED || error.code === statusCodes.IN_PROGRESS) return { ok: false, cancelled: true, message: '' };
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) return { ok: false, message: t('auth.err.noPlayServices') };
      // Android reports a wrong package name or SHA-1 as DEVELOPER_ERROR (code 10).
      if (error.code === '10' || /DEVELOPER_ERROR/.test(error.message)) {
        return { ok: false, message: t('auth.err.withCode', { message: t('auth.err.googleNotConfigured'), code: error.code }) };
      }
      // The code is a public status number. Showing it lets a tester report the real cause.
      return { ok: false, message: t('auth.err.withCode', { message: fallback, code: error.code }) };
    }
    return { ok: false, message: fallback };
  }
}

/** Signs in with Google. A first-time Google user gets an account, so this is also sign-up. */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const fallback = t('auth.err.googleSignInFailed');
  const picked = await pickGoogleAccount(fallback);
  if (!picked.ok) return picked;
  try {
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: picked.idToken });
    debug('supabase signInWithIdToken', { ok: !error, code: error?.code, status: error?.status, message: error?.message });
    return error ? { ok: false, message: authErrorMessage(error, fallback) } : { ok: true };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}

/** Adds Google to the signed-in account. Needs "Allow manual linking" on in the Supabase dashboard. */
export async function linkGoogleAccount(): Promise<GoogleAuthResult> {
  const fallback = t('auth.err.googleLinkFailed');
  const picked = await pickGoogleAccount(fallback);
  if (!picked.ok) return picked;
  try {
    const { error } = await supabase.auth.linkIdentity({ provider: 'google', token: picked.idToken });
    debug('supabase linkIdentity', { ok: !error, code: error?.code, status: error?.status, message: error?.message });
    return error ? { ok: false, message: authErrorMessage(error, fallback) } : { ok: true };
  } catch {
    return { ok: false, message: t('common.networkError') };
  }
}
