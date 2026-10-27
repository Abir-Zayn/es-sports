import { GoogleSignin } from '@react-native-google-signin/google-signin';

import { supabase } from '@/lib/supabase';

import { linkGoogleAccount, signInWithGoogle } from '../google-auth';

jest.mock('@/lib/env', () => ({ env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id.apps.googleusercontent.com' } }));
jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { signInWithIdToken: jest.fn(), linkIdentity: jest.fn() } },
}));
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: { configure: jest.fn(), hasPlayServices: jest.fn(), signOut: jest.fn(), signIn: jest.fn() },
  isErrorWithCode: (error: unknown) => typeof error === 'object' && error !== null && 'code' in error,
  statusCodes: { SIGN_IN_CANCELLED: 'CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'NO_PLAY' },
}));

const google = jest.mocked(GoogleSignin);
const auth = jest.mocked(supabase.auth);

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'log').mockImplementation(() => {});
  google.hasPlayServices.mockResolvedValue(true);
  google.signOut.mockResolvedValue(null);
  google.signIn.mockResolvedValue({ type: 'success', data: { idToken: 'google-id-token' } } as never);
  auth.signInWithIdToken.mockResolvedValue({ data: {}, error: null } as never);
  auth.linkIdentity.mockResolvedValue({ data: {}, error: null } as never);
});

describe('signInWithGoogle', () => {
  it('configures with the web client, then passes the ID token to Supabase', async () => {
    expect(await signInWithGoogle()).toEqual({ ok: true });
    expect(google.configure).toHaveBeenCalledWith({ webClientId: 'web-id.apps.googleusercontent.com' });
    expect(auth.signInWithIdToken).toHaveBeenCalledWith({ provider: 'google', token: 'google-id-token' });
  });

  it('forgets the last account first so the picker always opens', async () => {
    await signInWithGoogle();
    expect(google.signOut.mock.invocationCallOrder[0]).toBeLessThan(google.signIn.mock.invocationCallOrder[0]);
  });

  it('treats a dismissed picker as cancelled, without an error or a Supabase call', async () => {
    google.signIn.mockResolvedValue({ type: 'cancelled', data: null } as never);
    expect(await signInWithGoogle()).toEqual({ ok: false, cancelled: true, message: '' });
    google.signIn.mockRejectedValue({ code: 'CANCELLED' });
    expect(await signInWithGoogle()).toMatchObject({ ok: false, cancelled: true });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('explains missing Play services and a misconfigured build', async () => {
    google.signIn.mockRejectedValue({ code: 'NO_PLAY' });
    expect(await signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('Play services') });
    google.signIn.mockRejectedValue({ code: '10', message: 'DEVELOPER_ERROR' });
    expect(await signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('(code 10)') });
  });

  it('fails cleanly when Google returns no ID token', async () => {
    google.signIn.mockResolvedValue({ type: 'success', data: { idToken: null } } as never);
    expect(await signInWithGoogle()).toMatchObject({ ok: false });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('surfaces a Supabase error and a network failure', async () => {
    auth.signInWithIdToken.mockResolvedValue({ data: null, error: { code: 'over_request_rate_limit' } } as never);
    expect(await signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('Wait a minute') });
    auth.signInWithIdToken.mockRejectedValue(new Error('offline'));
    expect(await signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('connection') });
  });
});

describe('linkGoogleAccount', () => {
  it('links with linkIdentity, never signInWithIdToken, so no second account is created', async () => {
    expect(await linkGoogleAccount()).toEqual({ ok: true });
    expect(auth.linkIdentity).toHaveBeenCalledWith({ provider: 'google', token: 'google-id-token' });
    expect(auth.signInWithIdToken).not.toHaveBeenCalled();
  });

  it('reports a Google account that already belongs to someone else', async () => {
    auth.linkIdentity.mockResolvedValue({ data: null, error: { code: 'identity_already_exists' } } as never);
    expect(await linkGoogleAccount()).toMatchObject({ ok: false, message: expect.stringContaining('already linked') });
  });
});

// Last on purpose: doMock replaces the module for every test that runs after it.
describe('a build without the native Google module', () => {
  it('reports that a rebuild is needed instead of crashing', async () => {
    jest.resetModules();
    jest.doMock('@react-native-google-signin/google-signin', () => {
      throw new Error("TurboModuleRegistry.getEnforcing(...): 'RNGoogleSignin' could not be found.");
    });
    jest.doMock('@/lib/env', () => ({ env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id.apps.googleusercontent.com' } }));
    jest.doMock('@/lib/supabase', () => ({ supabase: { auth: { signInWithIdToken: jest.fn() } } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loads a fresh copy after resetModules
    const fresh = require('../google-auth') as typeof import('../google-auth');
    expect(await fresh.signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('not Expo Go') });
  });
});

describe('Expo Go', () => {
  it('does not try to load the native module and says why', async () => {
    jest.resetModules();
    const load = jest.fn();
    jest.doMock('@react-native-google-signin/google-signin', () => {
      load();
      return {};
    });
    jest.doMock('expo-constants', () => ({
      __esModule: true,
      default: { executionEnvironment: 'storeClient' },
      ExecutionEnvironment: { StoreClient: 'storeClient' },
    }));
    jest.doMock('@/lib/env', () => ({ env: { EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: 'web-id.apps.googleusercontent.com' } }));
    jest.doMock('@/lib/supabase', () => ({ supabase: { auth: { signInWithIdToken: jest.fn() } } }));
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- loads a fresh copy after resetModules
    const fresh = require('../google-auth') as typeof import('../google-auth');
    expect(await fresh.signInWithGoogle()).toMatchObject({ ok: false, message: expect.stringContaining('not Expo Go') });
    expect(load).not.toHaveBeenCalled();
  });
});
