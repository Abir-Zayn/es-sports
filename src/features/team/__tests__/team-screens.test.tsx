import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { Text } from 'react-native';

import { ThemeProvider } from '@/theme';

import { CreateTeamScreen } from '../create/create-team-screen';
import { withRealTeam } from '../real/with-real-team';

const REAL = 'f5b00000-0000-4000-8000-000000000001';
const mockReplace = jest.fn();
let mockParams: { id?: string } = {};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
const mockRpc = jest.fn();
const mockTeamReads = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
    from: (table: string) => mockTeamReads(table),
  },
}));

const team = { id: REAL, name: 'Real Strikers', short_name: 'RST', tone: 'blue', logo_url: null, area: 'Halishahar', district: null };

async function show(children: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></ThemeProvider>);
}

describe('create team screen', () => {
  beforeEach(() => { jest.clearAllMocks(); mockRpc.mockResolvedValue({ data: 'id', error: null }); });

  it('refuses a bad name before calling the server', async () => {
    await show(<CreateTeamScreen />);
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'A');
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    expect(screen.getByText(/Enter a team name of 2 to 40/)).toBeTruthy();
    expect(mockRpc).not.toHaveBeenCalled();
  });

  it('suggests the short name, creates the team and opens it', async () => {
    await show(<CreateTeamScreen />);
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'Chattogram Strikers');
    expect(screen.getByLabelText('Short name').props.value).toBe('CS');
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(1));
    const [name, args] = mockRpc.mock.calls[0];
    expect(name).toBe('create_team');
    expect(args).toMatchObject({ p_name: 'Chattogram Strikers', p_short_name: 'CS', p_tone: 'blue' });
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/team/[id]', params: { id: args.p_id } }));
  });

  it('keeps what was typed and retries under the same id after a failure', async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '08006', message: 'offline' } });
    await show(<CreateTeamScreen />);
    await fireEvent.changeText(screen.getByLabelText('Team name'), 'Port City');
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    expect(await screen.findByText(/Could not reach the server/)).toBeTruthy();
    expect(screen.getByLabelText('Team name').props.value).toBe('Port City');
    await fireEvent.press(screen.getByRole('button', { name: 'Create team' }));
    await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2));
    expect(mockRpc.mock.calls[1][1].p_id).toBe(mockRpc.mock.calls[0][1].p_id);
  });
});

describe('team routes', () => {
  const Sample = () => <Text>Sample Strikers page</Text>;
  const Route = withRealTeam(Sample, 'overview');
  beforeEach(() => {
    jest.clearAllMocks();
    mockTeamReads.mockImplementation((table: string) => ({
      select: () => ({
        eq: () => (table === 'teams' ? { maybeSingle: async () => ({ data: team, error: null }) } : Promise.resolve({ data: [], error: null })),
      }),
    }));
  });

  it('keeps the sample for a sample id', async () => {
    mockParams = { id: 'CS' };
    await show(<Route />);
    expect(screen.getByText('Sample Strikers page')).toBeTruthy();
  });

  it('reads the real team for a uuid and never shows the sample in its place', async () => {
    mockParams = { id: REAL };
    await show(<Route />);
    expect(await screen.findByText('Real Strikers')).toBeTruthy();
    expect(screen.queryByText('Sample Strikers page')).toBeNull();
    expect(screen.getByText('RST')).toBeTruthy();
  });

  it('says so when a real team does not exist, still not the sample', async () => {
    mockParams = { id: REAL };
    mockTeamReads.mockImplementation(() => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }) }));
    await show(<Route />);
    expect(await screen.findByText('This team could not be found.')).toBeTruthy();
    expect(screen.queryByText('Sample Strikers page')).toBeNull();
  });

  it('does not show a sample squad or matches for a real team', async () => {
    mockParams = { id: REAL };
    const Squad = withRealTeam(Sample, 'squad');
    await show(<Squad />);
    expect(await screen.findByText('Squads are chosen for each match.')).toBeTruthy();
    expect(screen.queryByText('Sample Strikers page')).toBeNull();
  });
});
