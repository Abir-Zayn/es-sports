import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import type { ReactNode } from 'react';

import CreateTournamentScreen from '@/app/tournament/create';
import { ThemeProvider } from '@/theme';

import { emptyDraft, formatDate, localDateKey } from '../draft';
import { loadDraft, saveDraft } from '../draft-storage';
import { TournamentDraftsScreen } from '../tournament-drafts-screen';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace, back: mockBack, canGoBack: () => true }),
  useLocalSearchParams: () => ({}), useFocusEffect: jest.fn(), Stack: { Screen: () => null },
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'organizer' } } }) }));
jest.mock('../draft-storage', () => ({ loadDraft: jest.fn(), saveDraft: jest.fn(), draftQueryKey: (id: string) => ['tournament-draft', id] }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
const load = jest.mocked(loadDraft);
const save = jest.mocked(saveDraft);
const pick = jest.mocked(ImagePicker.launchImageLibraryAsync);
const today = localDateKey(new Date());
const valid = { ...emptyDraft, name: 'Port City Cup', city: 'Chattogram', venue: 'Main Ground', startDate: today, endDate: today };
async function show(children: ReactNode = <CreateTournamentScreen />) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>{children}</QueryClientProvider></ThemeProvider>);
  await waitFor(() => expect(load).toHaveBeenCalled());
}

describe('create tournament form', () => {
  beforeEach(() => {
    jest.clearAllMocks(); load.mockResolvedValue(null); save.mockImplementation(async (_id, draft) => draft);
    pick.mockResolvedValue({ canceled: true, assets: null });
  });
  it('shows all requested fields together, with Add teams opening the teams screen', async () => {
    await show();
    expect(await screen.findByRole('button', { name: 'Add tournament cover' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add tournament profile photo' })).toBeTruthy();
    expect(screen.queryByText('Add tournament cover')).toBeNull();
    expect(screen.getByLabelText('Tournament name')).toBeTruthy();
    for (const name of ['Start date, Choose a date', 'End date, Choose a date', 'Match format, T20', 'Knockout type, League + knockout', 'Number of teams, 8 teams']) {
      expect(screen.getByRole('button', { name })).toBeTruthy();
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Add teams and staff' }));
    expect(mockPush).toHaveBeenLastCalledWith({
      pathname: '/tournament/add-teams',
      params: { teams: '8', name: '', side: '11', minSquad: '14', maxSquad: '16', opens: '', deadline: '', starts: '' },
    });
    expect(screen.queryByText('Continue to format')).toBeNull();
  });
  it('validates and saves the form with the selected format', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Save tournament draft' }));
    expect(screen.getByText('Enter a tournament name of at least 3 characters.')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Tournament name'), valid.name);
    await fireEvent.changeText(screen.getByLabelText('City or area'), valid.city);
    await fireEvent.changeText(screen.getByLabelText('Ground or venue'), valid.venue);
    for (const label of ['Start date', 'End date']) {
      await fireEvent.press(screen.getByRole('button', { name: `${label}, Choose a date` }));
      await fireEvent.press(screen.getByRole('button', { name: formatDate(today) }));
    }
    await fireEvent.press(screen.getByRole('button', { name: 'Match format, T20' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'T10' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save tournament draft' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('organizer', { ...valid, matchFormat: 'T10' }));
    expect(mockReplace).toHaveBeenCalledWith({ pathname: '/tournaments', params: { saved: '1' } });
  });
  it('prevents an incomplete knockout bracket', async () => {
    load.mockResolvedValue(valid); await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Knockout type, League + knockout' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Single elimination' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Number of teams, 8 teams' }));
    await fireEvent.press(screen.getByRole('radio', { name: '6 teams' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save tournament draft' }));
    expect(screen.getByText('Choose 4, 8, or 16 teams for a knockout tournament.')).toBeTruthy();
    expect(save).not.toHaveBeenCalled();
  });
  it('selects a cover and includes it in the saved draft', async () => {
    load.mockResolvedValue(valid);
    pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///picked.jpg', width: 1200, height: 675 }] });
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tournament cover' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change tournament cover' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Save tournament draft' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('organizer', { ...valid, coverUri: 'file:///picked.jpg' }));
  });
  it('selects the tournament profile photo independently of the cover', async () => {
    load.mockResolvedValue({ ...valid, coverUri: 'file:///cover.jpg' });
    pick.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///profile.jpg', width: 600, height: 600 }] });
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tournament profile photo' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change tournament profile photo' })).toBeTruthy());
    expect(pick).toHaveBeenCalledWith(expect.objectContaining({ aspect: [1, 1], allowsEditing: true }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save tournament draft' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('organizer', { ...valid, coverUri: 'file:///cover.jpg', profileUri: 'file:///profile.jpg' }));
  });
  it('preserves existing values when photo selection or saving fails', async () => {
    load.mockResolvedValue(valid); pick.mockRejectedValue(new Error('Photos unavailable')); save.mockRejectedValue(new Error('Storage unavailable'));
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Add tournament cover' }));
    expect(await screen.findByText('Photos unavailable')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save tournament draft' }));
    expect(await screen.findByText('Could not save your draft. Your entries are still here. Please try again.')).toBeTruthy();
    expect(screen.getByDisplayValue(valid.name)).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
  it('protects unsaved changes when closing and can save an incomplete draft', async () => {
    await show();
    await fireEvent.changeText(await screen.findByLabelText('Tournament name'), 'New Cup');
    await fireEvent.press(screen.getByRole('button', { name: 'Close tournament setup' }));
    expect(screen.getByText('Keep your tournament?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save draft and leave' }));
    await waitFor(() => expect(save).toHaveBeenCalledWith('organizer', { ...emptyDraft, name: 'New Cup' }));
  });
  it('links the tournaments tab to creation and reopens a draft', async () => {
    load.mockResolvedValue(valid); await show(<TournamentDraftsScreen />);
    await fireEvent.press(await screen.findByRole('button', { name: `Continue setup for ${valid.name}` }));
    expect(mockPush).toHaveBeenCalledWith('/tournament/create');
  });
});
