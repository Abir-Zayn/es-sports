import { fireEvent, render, screen } from '@testing-library/react-native';
import { recordMatch, resetLedger } from '@/features/profile/career-ledger';
import { ThemeProvider } from '@/theme';
import { PlayerProfileScreen } from '../player-profile-screen';

let mockId = 'Rafi Hasan';
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockId }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

beforeEach(() => { resetLedger(); mockId = 'Rafi Hasan'; mockPush.mockClear(); mockBack.mockClear(); });
const show = async () => render(<ThemeProvider><PlayerProfileScreen /></ThemeProvider>);

test('shows a squad player without an account by name, with an empty career and no sample figures', async () => {
  await show();
  expect(screen.getByText('Rafi Hasan')).toBeTruthy();
  expect(screen.getByText('No shot data recorded yet.')).toBeTruthy();
  expect(screen.getByText('No recent performances yet.')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

test('shows a safe empty state for an id that is not a name', async () => {
  mockId = 'unknown-id';
  await show();
  expect(screen.getByText('Player')).toBeTruthy();
  expect(screen.getByText('No recent performances yet.')).toBeTruthy();
});

test('rolls completed local matches into the matching player career', async () => {
  recordMatch({ matchId: 'new-match', completedAt: '2026-10-22T12:00:00Z', lines: [{
    profileId: mockId, won: true, opponent: 'Kings', performance: {
      playerId: 'rafi', playerName: 'Rafi Hasan', batted: true, runs: 100, ballsFaced: 60,
      fours: 8, sixes: 4, isNotOut: true, ballsBowled: 12, runsConceded: 14, wicketsTaken: 2, maidens: 0,
    },
  }] });
  await show();
  expect(screen.getByText('100*')).toBeTruthy();
  expect(screen.getByText('vs Kings')).toBeTruthy();
});
