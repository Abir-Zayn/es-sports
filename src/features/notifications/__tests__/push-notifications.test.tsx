import { renderHook, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';

import { forgetPushToken, savePushToken } from '@/lib/push-token';
import { supabase } from '@/lib/supabase';

import { getPushToken, tapTarget } from '../push/push-device';
import { usePushNotifications } from '../push/use-push-notifications';

jest.mock('expo-device', () => ({ isDevice: true }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'proj-1' } } } }));
jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('expo-notifications', () => ({
  AndroidImportance: { HIGH: 6 },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(async () => ({ type: 'expo', data: 'ExponentPushToken[abc]' })),
  addPushTokenListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponse: jest.fn(() => null),
  clearLastNotificationResponse: jest.fn(),
}));
type DeleteChain = { eq: jest.Mock<DeleteChain>; abortSignal: jest.Mock };
const mockDelete: DeleteChain = { eq: jest.fn((): DeleteChain => mockDelete), abortSignal: jest.fn(async () => ({ error: null })) };
jest.mock('@/lib/supabase', () => ({
  supabase: { rpc: jest.fn(async () => ({ error: null })), from: jest.fn(() => ({ delete: () => mockDelete })) },
}));

const N = jest.mocked(Notifications);
const tap = (url: unknown) => ({ notification: { request: { content: { data: { url } } } } }) as unknown as Notifications.NotificationResponse;

// The app is Android-only; the test environment defaults to iOS.
beforeAll(() => Object.defineProperty(Platform, 'OS', { get: () => 'android' }));
beforeEach(() => jest.clearAllMocks());

describe('getting the push token', () => {
  it('makes the channel, asks for permission when needed and returns the Expo token', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
    N.requestPermissionsAsync.mockResolvedValue({ granted: true } as never);
    expect(await getPushToken()).toBe('ExponentPushToken[abc]');
    expect(N.setNotificationChannelAsync).toHaveBeenCalledWith('default', expect.objectContaining({ name: 'General' }));
    expect(N.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'proj-1' });
  });

  it('returns nothing when the user says no', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: false } as never);
    N.requestPermissionsAsync.mockResolvedValue({ granted: false } as never);
    expect(await getPushToken()).toBeNull();
    expect(N.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });
});

it('opens only paths inside the app from a tap', () => {
  expect(tapTarget(tap('/match/m1'))).toBe('/match/m1');
  expect([tapTarget(tap('https://evil.example')), tapTarget(tap('//evil.example')), tapTarget(tap(42)), tapTarget(null)])
    .toEqual([null, null, null, null]);
});

describe('the push hook', () => {
  it('saves the token for the signed-in user', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    await renderHook(() => usePushNotifications('u1', false));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledWith('register_push_token', { p_token: 'ExponentPushToken[abc]', p_platform: 'android' }));
    expect(N.addPushTokenListener).toHaveBeenCalled();
  });

  it('does not loop when fetching the token fires the token listener (Android does this)', async () => {
    N.getPermissionsAsync.mockResolvedValue({ granted: true } as never);
    let fire: (token: { type: string; data: string }) => void = () => undefined;
    N.addPushTokenListener.mockImplementation(((listener: typeof fire) => { fire = listener; return { remove: jest.fn() }; }) as never);
    N.getExpoPushTokenAsync.mockImplementation(async () => {
      fire({ type: 'android', data: 'fcm-1' });
      return { type: 'expo', data: 'ExponentPushToken[abc]' };
    });
    await renderHook(() => usePushNotifications('u1', false));
    await waitFor(() => expect(supabase.rpc).toHaveBeenCalledTimes(1));
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(N.getExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(supabase.rpc).toHaveBeenCalledTimes(1);

    // A token that really changed is fetched and saved again.
    N.getExpoPushTokenAsync.mockImplementation(async () => ({ type: 'expo', data: 'ExponentPushToken[new]' }));
    fire({ type: 'android', data: 'fcm-2' });
    await waitFor(() => expect(supabase.rpc).toHaveBeenLastCalledWith('register_push_token', { p_token: 'ExponentPushToken[new]', p_platform: 'android' }));
    expect(supabase.rpc).toHaveBeenCalledTimes(2);
  });

  it('does nothing while signed out', async () => {
    await renderHook(() => usePushNotifications(undefined, false));
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('opens the screen of the tap that launched the app, once ready', async () => {
    N.getLastNotificationResponse.mockReturnValue(tap('/notifications'));
    await renderHook(() => usePushNotifications(undefined, true));
    expect(router.push).toHaveBeenCalledWith('/notifications');
    expect(N.clearLastNotificationResponse).toHaveBeenCalled();
  });
});

it('forgets the saved token on sign-out, once', async () => {
  await savePushToken('ExponentPushToken[abc]', 'android');
  await forgetPushToken();
  expect(mockDelete.eq).toHaveBeenCalledWith('token', 'ExponentPushToken[abc]');
  await forgetPushToken();
  expect(supabase.from).toHaveBeenCalledTimes(1);
});
