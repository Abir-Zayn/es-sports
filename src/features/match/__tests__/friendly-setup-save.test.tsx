import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { createFriendlyMatch } from '@/features/scoring/data/friendly-create';
import { ThemeProvider } from '@/theme';

import { FriendlySetupScreen } from '../friendly-setup-screen';
import { sweepOrphanTeamImagesDaily } from '../friendly/team-image-sweep';

const ME = '11111111-1111-4111-8111-111111111111';
const mockReplace = jest.fn();
jest.mock('@/features/scoring/data/friendly-create', () => ({ createFriendlyMatch: jest.fn() }));
jest.mock('../friendly/team-image-sweep', () => ({ sweepOrphanTeamImagesDaily: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../friendly/team-images', () => ({
  uploadTeamImage: jest.fn().mockResolvedValue('https://example.com/team.png'),
}));
jest.mock('../friendly/search-players', () => ({ searchPlayers: jest.fn().mockResolvedValue([]) }));
jest.mock('../components/saved-friendlies', () => ({ SavedFriendlies: () => null }));
jest.mock('@/lib/share', () => ({ shareText: jest.fn().mockResolvedValue(undefined), appLink: (path: string) => `essports://${path}` }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace, canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({
  useAuth: () => ({ session: { user: { id: '11111111-1111-4111-8111-111111111111' } } }),
}));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));
// The real coin and its animation are covered in friendly-setup-screen.test.tsx. This stub reaches `onStart`
// directly, and "Double tap" calls it twice in one handler, before any re-render, as a fast double tap does.
jest.mock('../components/toss-coin-modal', () => ({
  TossCoinModal: ({ visible, error, onClose, onStart }: {
    visible: boolean; error?: string | null; onClose: () => void; onStart: (toss: unknown) => void;
  }) => {
    const { Pressable, Text, View } = jest.requireActual('react-native');
    const toss = { calledBy: 'teamA', call: 'heads', landed: 'heads', winner: 'teamA', decision: 'bat', tossedAt: '2026-10-31T12:00:00.000Z' };
    if (!visible) return null;
    return <View>
      {error ? <Text>{error}</Text> : null}
      <Pressable accessibilityRole="button" accessibilityLabel="Start scoring" onPress={() => onStart(toss)} />
      <Pressable accessibilityRole="button" accessibilityLabel="Double tap" onPress={() => { onStart(toss); onStart(toss); }} />
      <Pressable accessibilityRole="button" accessibilityLabel="Close toss" onPress={onClose} />
    </View>;
  },
}));

const SAVE_ERROR = 'Could not save this match or its images. Check your connection and image size, then try again.';

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><FriendlySetupScreen /></QueryClientProvider></ThemeProvider>);
}

/** Four a side, both teams named and full. */
async function fillForm() {
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.changeText(screen.getByLabelText('Team A name'), 'Karnaphuli Kings');
  await fireEvent.changeText(screen.getByLabelText('Team B name'), 'Chattogram Strikers');
  await fireEvent.press(screen.getByRole('button', { name: 'Add me to Team A' }));
  const squads: [string, string[]][] = [['Team A', ['Rafi Hasan', 'Imran Kayes', 'Sumon Das']], ['Team B', ['Liton Roy', 'Nayeem Islam', 'Tanvir Ahmed', 'Arif Khan']]];
  for (const [team, names] of squads) {
    for (const name of names) {
      await fireEvent.press(screen.getByRole('button', { name: `Quick add to ${team}` }));
      await fireEvent.changeText(screen.getByLabelText('Player name'), name);
      await fireEvent.press(screen.getByRole('button', { name: 'Add to squad' }));
    }
  }
}

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const savedIds = () => jest.mocked(createFriendlyMatch).mock.calls.map(([match]) => match.id);

describe('saving a friendly', () => {
  beforeEach(() => {
    jest.mocked(createFriendlyMatch).mockReset().mockResolvedValue('match-id');
    jest.mocked(sweepOrphanTeamImagesDaily).mockClear();
    mockReplace.mockReset();
  });

  it('sweeps orphaned team images for the signed-in account when the screen opens', async () => {
    await show();
    expect(sweepOrphanTeamImagesDaily).toHaveBeenCalledWith(ME);
  });

  it('sends one save for a double tap', async () => {
    await show();
    await fillForm();
    await press('Proceed to Toss');
    await press('Double tap');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(createFriendlyMatch).toHaveBeenCalledTimes(1);
  });

  it('retries a failed save under the same id', async () => {
    jest.mocked(createFriendlyMatch).mockRejectedValueOnce(new Error('offline'));
    await show();
    await fillForm();
    await press('Proceed to Toss');
    await press('Start scoring');
    await screen.findByText(SAVE_ERROR);
    await press('Start scoring');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(savedIds()).toEqual([savedIds()[0], savedIds()[0]]);
  });

  it('deletes nothing when the toss is closed after a failed save, and saves under a new id', async () => {
    jest.mocked(createFriendlyMatch).mockRejectedValueOnce(new Error('offline'));
    await show();
    await fillForm();
    await press('Proceed to Toss');
    await press('Start scoring');
    await screen.findByText(SAVE_ERROR);
    await press('Close toss');
    // The lost save may still land on the server, so its images are left for the day-old sweep.
    expect(sweepOrphanTeamImagesDaily).toHaveBeenCalledTimes(1);
    await press('Proceed to Toss');
    await press('Start scoring');
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(savedIds()[1]).not.toBe(savedIds()[0]);
  });
});
