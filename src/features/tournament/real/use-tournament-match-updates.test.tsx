import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useTournamentMatchUpdates } from './use-tournament-match-updates';

const mockOn = jest.fn();
const mockSubscribe = jest.fn();
const mockChannel = jest.fn();
const mockRemove = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: { channel: (...args: unknown[]) => mockChannel(...args), removeChannel: (...args: unknown[]) => mockRemove(...args) } }));

test('refreshes the schedule, table and top players after changes, coalesces updates and cleans up', async () => {
  jest.useFakeTimers();
  const channel = { on: mockOn, subscribe: mockSubscribe };
  mockChannel.mockReturnValue(channel);
  mockOn.mockReturnValue(channel);
  mockSubscribe.mockReturnValue(channel);
  const client = new QueryClient();
  const invalidate = jest.spyOn(client, 'invalidateQueries').mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const { unmount } = await renderHook(() => useTournamentMatchUpdates('tournament'), { wrapper });
  expect(mockOn).toHaveBeenCalledWith('postgres_changes', expect.objectContaining({ filter: 'tournament_id=eq.tournament' }), expect.any(Function));
  const change = mockOn.mock.calls[0][2] as () => void;
  await act(() => { change(); change(); jest.advanceTimersByTime(300); });
  // One burst of changes refreshes each query once.
  expect(invalidate).toHaveBeenCalledTimes(3);
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tournament-schedule', 'tournament'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tournament-standings', 'tournament'] });
  expect(invalidate).toHaveBeenCalledWith({ queryKey: ['tournament-player-stats', 'tournament'] });
  await act(() => { change(); });
  await unmount();
  await act(() => { jest.runOnlyPendingTimers(); });
  expect(invalidate).toHaveBeenCalledTimes(3);
  expect(mockRemove).toHaveBeenCalledWith(channel);
  jest.useRealTimers();
});
