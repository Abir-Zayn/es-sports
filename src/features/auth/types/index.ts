// Types shared across the auth feature and the screens that use it.
import type { z } from 'zod';

import type { signInSchema } from '../server/sign-in';
import type { signUpSchema } from '../server/sign-up';

export type LinkedAccounts = {
  /** Signed up with an email and password. */
  hasEmail: boolean;
  /** The linked Google account's name and photo, or null when Google is not linked. */
  google: ProviderProfile | null;
};

export type LinkedAccountsResult = { ok: true; accounts: LinkedAccounts } | { ok: false; message: string };

/** `cancelled` means the user dismissed the account picker; show no error for it. */
export type GoogleAuthResult = { ok: true } | { ok: false; cancelled?: boolean; message: string };

export type SendResetResult = { ok: true } | { ok: false; message: string };

/** The name and photo a sign-in provider such as Google shares. Both are optional. */
export type ProviderProfile = { fullName?: string; avatarUrl?: string };

export type SignInInput = z.infer<typeof signInSchema>;

export type SignInResult = { ok: true } | { ok: false; message: string; needsConfirmation?: boolean };

export type SignUpInput = z.infer<typeof signUpSchema>;

export type SignUpResult = { ok: true; signedIn: boolean } | { ok: false; message: string };
