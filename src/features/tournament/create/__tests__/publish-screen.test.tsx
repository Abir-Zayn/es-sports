import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import CreateTournamentScreen from '@/app/tournament/create';
import { ThemeProvider } from '@/theme';

import { emptyDraft, localDateKey } from '../draft';
import { loadDraft } from '../draft-storage';

const mockReplace = jest.fn();
const mockPublish = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), replace: mockReplace, back: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}), useFocusEffect: jest.fn(), Stack: { Screen: () => null },
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'organizer' } } }) }));
jest.mock('../draft-storage', () => ({ loadDraft: jest.fn(), saveDraft: jest.fn(), draftQueryKey: (id: string) => ['tournament-draft', id] }));
jest.mock('../use-publish-tournament', () => {
  const { useMutation } = jest.requireActual('@tanstack/react-query');
  return { usePublishTournament: () => useMutation({ mutationFn: (draft: unknown) => mockPublish(draft) }) };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const today = localDateKey(new Date());
const valid = { ...emptyDraft, name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', startDate: today, endDate: today };

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><CreateTournamentScreen /></QueryClientProvider></ThemeProvider>);
  await waitFor(() => expect(loadDraft).toHaveBeenCalled());
}

describe('publishing from the create screen', () => {
  beforeEach(() => { jest.clearAllMocks(); jest.mocked(loadDraft).mockResolvedValue(null); });

  it('refuses an incomplete setup before the server is called', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Publish tournament' }));
    expect(screen.getByText('Enter a tournament name of at least 3 characters.')).toBeTruthy();
    expect(mockPublish).not.toHaveBeenCalled();
  });

  it('publishes a complete draft and opens the new tournament by its id', async () => {
    jest.mocked(loadDraft).mockResolvedValue(valid);
    mockPublish.mockResolvedValue('f5c00000-0000-4000-8000-000000000001');
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Publish tournament' }));
    await waitFor(() => expect(mockPublish).toHaveBeenCalledWith(valid));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith({ pathname: '/tournament/[id]', params: { id: 'f5c00000-0000-4000-8000-000000000001' } }));
  });

  it('keeps the form and says why when the server refuses', async () => {
    jest.mocked(loadDraft).mockResolvedValue(valid);
    mockPublish.mockRejectedValue(Object.assign(new Error('x'), { code: '22023' }));
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Publish tournament' }));
    expect(await screen.findByText(/Check the details/)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Tournament name').props.value).toBe('Port City Cup');
  });
});
