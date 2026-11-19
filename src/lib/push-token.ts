// This device's Expo push token and its row in `push_tokens`. Shared so sign-out (auth) can drop the token before
// the session ends, while the notifications feature owns getting it.
import { supabase } from './supabase';

/** How long sign-out waits for the token to be removed before signing out anyway. */
const FORGET_TIMEOUT_MS = 3_000;

let current: string | null = null;

/** Saves the token for the signed-in user; a device that changed accounts moves to the new one. */
export async function savePushToken(token: string, platform: 'android' | 'ios'): Promise<void> {
  const { error } = await supabase.rpc('register_push_token', { p_token: token, p_platform: platform });
  if (error) throw error;
  current = token;
}

/** Best effort: stops pushes to this device for the user signing out. Never throws. */
export async function forgetPushToken(): Promise<void> {
  const token = current;
  if (!token) return;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FORGET_TIMEOUT_MS);
  try {
    await supabase.from('push_tokens').delete().eq('token', token).abortSignal(controller.signal);
    current = null;
  } catch {
    // The token is moved to whoever signs in next, and dead tokens are dropped on Expo's receipts.
  } finally {
    clearTimeout(timer);
  }
}
