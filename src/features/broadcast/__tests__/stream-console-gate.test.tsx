import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Platform } from 'react-native';

import { ThemeProvider } from '@/theme';

import { StreamConsoleScreen } from '../console/stream-console-screen';

const mockSchedule = jest.fn();
const mockStreamers = jest.fn();
let mockUser: string | undefined = 'mod1';
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({ useLocalSearchParams: () => ({ tournamentId: 't1', fixtureId: 'f1' }) }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: mockUser ? { user: { id: mockUser } } : null }) }));
jest.mock('@/features/tournament/schedule-builder/schedule-repository', () => ({ fetchSchedule: (...a: unknown[]) => mockSchedule(...a) }));
jest.mock('../data/fixture-streamers', () => ({ ...jest.requireActual('../data/fixture-streamers'), fetchFixtureStreamers: (...a: unknown[]) => mockStreamers(...a) }));
jest.mock('../console/console-body', () => ({
  ConsoleBody: ({ matchId, title }: { matchId: string; title: string }) => {
    const { Text } = jest.requireActual('react-native');
    return <Text>{`console:${matchId}:${title}`}</Text>;
  },
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
}));

const team = (id: string, name: string) => ({ kind: 'team', team: { id, name, short: id } }) as const;
const fixture = (extra: object = {}) => ({ id: 'f1', number: 1, stage: 'League', round: 0, home: team('a', 'Tigers'), away: team('b', 'Lions'), date: '2030-01-05', startMin: 600, ...extra });
const assigned = (state: string, streamerId = 'mod1') => new Map([['f1', { fixtureId: 'f1', streamerId, state, liveAt: null }]]);

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><StreamConsoleScreen /></QueryClientProvider></ThemeProvider>);
}

beforeEach(() => {
  mockUser = 'mod1';
  Platform.OS = 'android';
  mockSchedule.mockResolvedValue({ matches: [fixture({ match: { id: 'm1', status: 'live' } })] });
  mockStreamers.mockResolvedValue(assigned('assigned'));
});
afterEach(() => { Platform.OS = 'ios'; });

describe('the stream console gate', () => {
  it('opens the console for the assigned streamer of a started match', async () => {
    await show();
    expect(await screen.findByText('console:m1:Tigers v Lions')).toBeTruthy();
  });

  it('refuses anyone who is not the streamer', async () => {
    mockUser = 'someone-else';
    await show();
    expect(await screen.findByText(/Only the streamer chosen/)).toBeTruthy();
  });

  it('asks the streamer to wait until the match has started', async () => {
    mockSchedule.mockResolvedValue({ matches: [fixture()] });
    await show();
    expect(await screen.findByText(/has not started yet/)).toBeTruthy();
  });

  it('says so when the broadcast has already ended', async () => {
    mockStreamers.mockResolvedValue(assigned('ended'));
    await show();
    expect(await screen.findByText(/has ended/)).toBeTruthy();
  });

  it('is Android only', async () => {
    Platform.OS = 'ios';
    await show();
    expect(await screen.findByText(/Android phones only/)).toBeTruthy();
  });
});
