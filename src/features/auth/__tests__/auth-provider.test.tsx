import { act, render, screen } from '@testing-library/react-native';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { AppState, Text, type AppStateStatus } from 'react-native';

import { queryClient } from '@/lib/query-client';
import { supabase } from '@/lib/supabase';

import { AuthProvider, useAuth } from '../auth-provider';

jest.mock('@/lib/supabase', () => ({
  supabase: { auth: { onAuthStateChange: jest.fn(), startAutoRefresh: jest.fn(), stopAutoRefresh: jest.fn() } },
}));
jest.mock('@/lib/query-client', () => ({ queryClient: { clear: jest.fn() } }));

let listener: (event: AuthChangeEvent, session: Session | null) => void;
const unsubscribe = jest.fn();
const remove = jest.fn();
let changeState: (state: AppStateStatus) => void;

function State() {
  const { session, isLoading } = useAuth();
  return <Text>{isLoading ? 'Restoring' : session?.user.id ?? 'Signed out'}</Text>;
}

async function emit(event: AuthChangeEvent, id: string | null) {
  await act(() => listener(event, id ? { user: { id } } as Session : null));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(supabase.auth.onAuthStateChange).mockImplementation((callback) => {
    listener = callback;
    return { data: { subscription: { unsubscribe } } } as never;
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, callback) => {
    changeState = callback;
    return { remove };
  });
});

afterEach(() => jest.restoreAllMocks());

it('waits for session restoration and responds to login and logout', async () => {
  await render(<AuthProvider><State /></AuthProvider>);
  expect(screen.getByText('Restoring')).toBeTruthy();
  await emit('INITIAL_SESSION', null);
  expect(screen.getByText('Signed out')).toBeTruthy();
  await emit('SIGNED_IN', 'player-a');
  expect(screen.getByText('player-a')).toBeTruthy();
  await emit('SIGNED_OUT', null);
  expect(screen.getByText('Signed out')).toBeTruthy();
});

it('restores a saved user without login and clears user data only when identity changes', async () => {
  await render(<AuthProvider><State /></AuthProvider>);
  await emit('INITIAL_SESSION', 'player-a');
  expect(screen.getByText('player-a')).toBeTruthy();
  expect(queryClient.clear).toHaveBeenCalledTimes(1);
  await emit('TOKEN_REFRESHED', 'player-a');
  expect(queryClient.clear).toHaveBeenCalledTimes(1);
  await emit('SIGNED_IN', 'player-b');
  expect(queryClient.clear).toHaveBeenCalledTimes(2);
  await emit('SIGNED_OUT', null);
  expect(queryClient.clear).toHaveBeenCalledTimes(3);
});

it('refreshes only in the foreground and cleans up both subscriptions', async () => {
  const { unmount } = await render(<AuthProvider><State /></AuthProvider>);
  await act(() => changeState('active'));
  expect(supabase.auth.startAutoRefresh).toHaveBeenCalled();
  await act(() => changeState('background'));
  expect(supabase.auth.stopAutoRefresh).toHaveBeenCalled();
  await unmount();
  expect(remove).toHaveBeenCalledTimes(1);
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
