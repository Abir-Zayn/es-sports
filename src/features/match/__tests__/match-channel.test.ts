import { isWatchConnected, watchMatch } from '../live/match-channel';

type Handler = () => void;
type FakeChannel = { name: string; handlers: Handler[]; on: jest.Mock; subscribe: jest.Mock; status: (value: string) => void };

const mockChannels: FakeChannel[] = [];
const mockRemove = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    // Like Supabase: a topic still open, or still being removed, hands back the same channel.
    channel: (name: string) => {
      const existing = mockChannels.find((open) => open.name === name);
      if (existing) return existing;
      const channel: FakeChannel = {
        name, handlers: [], status: () => undefined,
        on: jest.fn((_type: string, _filter: unknown, handler: Handler) => { channel.handlers.push(handler); return channel; }),
        subscribe: jest.fn((callback: (value: string) => void) => { channel.status = callback; return channel; }),
      };
      mockChannels.push(channel);
      return channel;
    },
    removeChannel: (channel: unknown) => mockRemove(channel),
  },
}));

const MATCH = '22222222-2222-4222-8222-000000000001';

beforeEach(() => {
  jest.useFakeTimers();
  mockChannels.length = 0;
  mockRemove.mockClear();
});
afterEach(() => jest.useRealTimers());

describe('the match Realtime channel', () => {
  it('shares one channel between the screens of a match and removes it after the last one stops', () => {
    const stopA = watchMatch(MATCH, jest.fn());
    const stopB = watchMatch(MATCH, jest.fn());
    expect(mockChannels).toHaveLength(1);
    expect(mockChannels[0].name).toMatch(new RegExp(`^match:${MATCH}:\\d+$`));
    expect(mockChannels[0].on).toHaveBeenCalledWith('postgres_changes',
      expect.objectContaining({ table: 'ball_events', filter: `match_id=eq.${MATCH}` }), expect.any(Function));
    expect(mockChannels[0].on).toHaveBeenCalledWith('postgres_changes',
      expect.objectContaining({ table: 'matches', filter: `id=eq.${MATCH}` }), expect.any(Function));
    stopA();
    expect(mockRemove).not.toHaveBeenCalled();
    stopB();
    expect(mockRemove).toHaveBeenCalledWith(mockChannels[0]);
  });

  it('opens a new channel for a screen that mounts again while the last one is still being removed', () => {
    watchMatch(MATCH, jest.fn())();
    const onChange = jest.fn();
    const stop = watchMatch(MATCH, onChange);
    expect(mockChannels).toHaveLength(2);
    expect(mockChannels[1].name).not.toBe(mockChannels[0].name);
    expect(mockRemove).toHaveBeenCalledWith(mockChannels[0]);
    expect(mockRemove).not.toHaveBeenCalledWith(mockChannels[1]);
    mockChannels[1].handlers[0]();
    jest.advanceTimersByTime(400);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  it('refreshes once for a burst of changes, such as an undo that voids several balls', () => {
    const onChange = jest.fn();
    const stop = watchMatch(MATCH, onChange);
    mockChannels[0].handlers.forEach((handler) => { handler(); handler(); });
    expect(onChange).not.toHaveBeenCalled();
    jest.advanceTimersByTime(400);
    expect(onChange).toHaveBeenCalledTimes(1);
    stop();
  });

  it('reports whether the channel is connected and drops a pending refresh when stopped', () => {
    const onChange = jest.fn();
    const stop = watchMatch(MATCH, onChange);
    expect(isWatchConnected(MATCH)).toBe(false);
    mockChannels[0].status('SUBSCRIBED');
    expect(isWatchConnected(MATCH)).toBe(true);
    mockChannels[0].handlers[0]();
    stop();
    jest.advanceTimersByTime(400);
    expect(onChange).not.toHaveBeenCalled();
    expect(isWatchConnected(MATCH)).toBe(false);
  });
});
