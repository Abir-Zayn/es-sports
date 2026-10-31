import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { AccessibilityInfo } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { createFriendlyMatch } from '@/features/scoring/data/friendly-create';
import { uploadTeamImage } from '../friendly/team-images';
import { searchPlayers } from '../friendly/search-players';
import { ThemeProvider } from '@/theme';

import { FriendlySetupScreen } from '../friendly-setup-screen';

const mockReplace = jest.fn();
jest.mock('@/features/scoring/data/friendly-create', () => ({ createFriendlyMatch: jest.fn().mockResolvedValue('match-id') }));
jest.mock('../friendly/team-image-sweep', () => ({ sweepOrphanTeamImagesDaily: jest.fn().mockResolvedValue(undefined) }));
jest.mock('../friendly/search-players', () => ({ searchPlayers: jest.fn().mockResolvedValue([]) }));
jest.mock('../components/saved-friendlies', () => ({ SavedFriendlies: () => null }));
jest.mock('../friendly/team-images', () => ({
  uploadTeamImage: jest.fn().mockResolvedValue('https://example.com/team.png'),
}));
jest.mock('@/lib/share', () => ({ shareText: jest.fn().mockResolvedValue(undefined), appLink: (path: string) => `essports://${path}` }));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('expo-image', () => ({
  Image: ({ source }: { source: { uri: string } }) => {
    const { View } = jest.requireActual('react-native');
    return <View testID={`image-${source.uri}`} />;
  },
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: mockReplace, canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <FriendlySetupScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

async function quickAdd(team: 'Team A' | 'Team B', name: string) {
  await fireEvent.press(screen.getByRole('button', { name: `Quick add to ${team}` }));
  await fireEvent.changeText(screen.getByLabelText('Player name'), name);
  await fireEvent.press(screen.getByRole('button', { name: 'Add to squad' }));
}

/** Four a side, both teams named and full. */
async function fillForm() {
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.press(screen.getByRole('button', { name: 'Fewer players a side' }));
  await fireEvent.changeText(screen.getByLabelText('Team A name'), 'Karnaphuli Kings');
  await fireEvent.changeText(screen.getByLabelText('Team B name'), 'Chattogram Strikers');
  await fireEvent.press(screen.getByRole('button', { name: 'Add me to Team A' }));
  for (const name of ['Rafi Hasan', 'Imran Kayes', 'Sumon Das']) await quickAdd('Team A', name);
  for (const name of ['Liton Roy', 'Nayeem Islam', 'Tanvir Ahmed', 'Arif Khan']) await quickAdd('Team B', name);
}

describe('friendly match setup', () => {
  beforeEach(() => {
    jest.mocked(createFriendlyMatch).mockReset().mockResolvedValue('match-id');
    mockReplace.mockReset();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('explains what is missing instead of opening the toss', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    expect(screen.getByText('Fix the highlighted parts to go to the toss.')).toBeTruthy();
    expect(screen.getAllByText('Give the team a name of 2 to 30 characters.')).toHaveLength(2);
    expect(screen.queryByText('Flip coin')).toBeNull();
  });

  it('builds two squads, benches the extra player, and keeps the side at its size', async () => {
    await show();
    await fillForm();
    expect(screen.getByText('Organiser Me')).toBeTruthy();
    expect(screen.getAllByText('4/4 playing · 4/16 in squad')).toHaveLength(2);
    expect(screen.queryByText('Playing')).toBeNull();
    expect(screen.queryByRole('switch', { name: 'Liton Roy playing' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add me to Team B' })).toBeNull();
    await quickAdd('Team B', 'Reserve Player');
    expect(screen.getByText('4/4 playing · 5/16 in squad')).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Reserve Player playing', checked: false })).toBeTruthy();
    await fireEvent.press(screen.getByRole('switch', { name: 'Reserve Player playing' }));
    expect(screen.getByText('4 are already playing. Bench someone first.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('switch', { name: 'Liton Roy playing' }));
    await fireEvent.press(screen.getByRole('switch', { name: 'Reserve Player playing' }));
    expect(screen.getByRole('switch', { name: 'Reserve Player playing', checked: true })).toBeTruthy();
    expect(screen.getByRole('switch', { name: 'Liton Roy playing', checked: false })).toBeTruthy();
    expect(screen.queryByText('Playing')).toBeNull();
  });

  it('keeps a searched player’s profile photo when adding them to the squad', async () => {
    const avatarUrl = 'https://example.com/rafi.jpg';
    jest.mocked(searchPlayers).mockResolvedValueOnce([{ id: 'user-rafi', name: 'Rafi Hasan', area: 'Agrabad', avatarUrl }]);
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Find player for Team A' }));
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'Rafi');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add Rafi Hasan' }));
    expect(screen.getByText('Rafi Hasan')).toBeTruthy();
    expect(screen.getByTestId(`image-${avatarUrl}`, { includeHiddenElements: true })).toBeTruthy();
  });

  it('hands scoring to the selected person and sends the creator to the match view', async () => {
    const scorerId = '44444444-4444-4444-8444-444444444444';
    jest.mocked(searchPlayers).mockResolvedValueOnce([{ id: scorerId, name: 'Rafi Hasan', area: null, avatarUrl: null }]);
    await show();
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Find player for Team B' }));
    await fireEvent.changeText(screen.getByLabelText('Search players by name'), 'Rafi');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add Rafi Hasan' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Scorer: You. Change scorer' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Scorer Rafi Hasan' }));
    expect(screen.getByText('Only this person can enter scores. They will receive a link.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await fireEvent.press(screen.getByRole('button', { name: 'Flip coin' }));
    await screen.findByText('Karnaphuli Kings won the toss!');
    await fireEvent.press(screen.getByRole('button', { name: 'Bat first' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(mockReplace.mock.calls[0][0]).toMatchObject({ pathname: '/match/[id]' });
    expect(jest.mocked(createFriendlyMatch).mock.calls[0][2]).toEqual([scorerId]);
  });

  it('tosses, lets the winner choose, and hands the match to the scorer', async () => {
    await show();
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await fireEvent.press(screen.getByRole('button', { name: 'Flip coin' }));
    expect(await screen.findByText('Karnaphuli Kings won the toss!')).toBeTruthy();
    expect(screen.getByText('Karnaphuli Kings called heads; it landed heads.')).toBeTruthy();
    jest.mocked(Math.random).mockRestore();
    expect(screen.getByRole('button', { name: 'Start scoring' })).toBeDisabled();
    await fireEvent.press(screen.getByRole('button', { name: 'Bowl first' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));

    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const { params } = mockReplace.mock.calls[0][0] as { params: { id: string } };
    expect(params.id).toMatch(/^[0-9a-f]{8}-/);
    const [match, players] = jest.mocked(createFriendlyMatch).mock.calls[0];
    expect(match).toMatchObject({ id: params.id, status: 'scheduled', started_at: null, overs_limit: 6, toss_winner_side: 'a', toss_decision: 'bowl', team_b_name: 'Chattogram Strikers' });
    expect(players.filter((p) => p.in_playing_xi)).toHaveLength(8);
  });

  it('keeps the toss open and retries the same match if saving fails', async () => {
    jest.mocked(createFriendlyMatch).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce('match-id');
    await show();
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await fireEvent.press(screen.getByRole('button', { name: 'Flip coin' }));
    await screen.findByText('Karnaphuli Kings won the toss!');
    await fireEvent.press(screen.getByRole('button', { name: 'Bat first' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));
    expect(await screen.findByText('Could not save this match or its images. Check your connection and image size, then try again.')).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    const calls = jest.mocked(createFriendlyMatch).mock.calls;
    expect(calls[0][0].id).toBe(calls[1][0].id);
  });

  it('lets each team choose an image and saves uploaded URLs with the match', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValue({ canceled: false, assets: [
      { uri: 'file:///team.png', width: 100, height: 100, mimeType: 'image/png' },
    ] });
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Add Team A image' }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Change Team A image' })).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Add Team B image' }));
    expect(screen.queryByLabelText('Team A colour Blue')).toBeNull();
    await fillForm();
    await fireEvent.press(screen.getByRole('button', { name: 'Proceed to Toss' }));
    jest.spyOn(Math, 'random').mockReturnValue(0.1);
    await fireEvent.press(screen.getByRole('button', { name: 'Flip coin' }));
    await screen.findByText('Karnaphuli Kings won the toss!');
    await fireEvent.press(screen.getByRole('button', { name: 'Bat first' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Start scoring' }));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));
    expect(jest.mocked(uploadTeamImage).mock.calls.map((call) => call[2])).toEqual(['a', 'b']);
    expect(jest.mocked(createFriendlyMatch).mock.calls[0][0]).toMatchObject({
      team_a_image_url: 'https://example.com/team.png', team_b_image_url: 'https://example.com/team.png',
    });
  });
});
