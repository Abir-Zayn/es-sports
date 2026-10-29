import { fireEvent, render, screen } from '@testing-library/react-native';
import { recordMatch, resetLedger } from '@/features/profile/career-ledger';
import { PlayerDetailSheet } from '@/features/team/components/player-detail-sheet';
import { ThemeProvider } from '@/theme';
import { PlayerProfileScreen } from '../player-profile-screen';

let mockId = '11111111-1111-4111-8111-000000000001';
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockId }),
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

beforeEach(() => { resetLedger(); mockId = '11111111-1111-4111-8111-000000000001'; mockPush.mockClear(); mockBack.mockClear(); });
const show = async () => render(<ThemeProvider><PlayerProfileScreen /></ThemeProvider>);

test('renders the seeded career and its four zone shares', async () => {
  await show();
  expect(screen.getByText('Tanvir Ahmed')).toBeTruthy();
  expect(screen.getByText('#18')).toBeTruthy();
  expect(screen.getByText('78*')).toBeTruthy();
  expect(screen.getByText('4/18')).toBeTruthy();
  expect(screen.getByText('Off side')).toBeTruthy();
  expect(screen.getByText('Straight / V')).toBeTruthy();
  expect(screen.getByText('Leg side')).toBeTruthy();
  expect(screen.getByText('Behind')).toBeTruthy();
  expect(screen.getByText('vs Agrabad Titans')).toBeTruthy();
  await fireEvent.press(screen.getByRole('button', { name: 'Go back' }));
  expect(mockBack).toHaveBeenCalledTimes(1);
});

test('resolves another seed player and shows a safe empty state for unknown IDs', async () => {
  mockId = '11111111-1111-4111-8111-000000000002';
  const rendered = await show();
  expect(screen.getByText('Liton Roy')).toBeTruthy();
  await rendered.unmount();
  mockId = 'unknown-uuid';
  await show();
  expect(screen.getByText('Player')).toBeTruthy();
  expect(screen.getByText('No shot data recorded yet.')).toBeTruthy();
  expect(screen.getByText('No recent performances yet.')).toBeTruthy();
});

test('opens the chosen squad player career and closes the sheet', async () => {
  const close = jest.fn();
  await render(<ThemeProvider><PlayerDetailSheet player={{ name: 'Rafi Hasan', role: 'Batter' }} tone="blue" visible onClose={close} /></ThemeProvider>);
  await fireEvent.press(screen.getByRole('button', { name: 'View Full Career Profile' }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(mockPush).toHaveBeenCalledWith({ pathname: '/player/[id]', params: { id: 'Rafi Hasan', name: 'Rafi Hasan', role: 'Batter' } });
});

test('rolls completed local matches into the matching player career', async () => {
  recordMatch({ matchId: 'new-match', completedAt: '2026-10-22T12:00:00Z', lines: [{
    profileId: mockId, won: true, opponent: 'Kings', performance: {
      playerId: 'tanvir', playerName: 'Tanvir Ahmed', batted: true, runs: 100, ballsFaced: 60,
      fours: 8, sixes: 4, isNotOut: true, ballsBowled: 12, runsConceded: 14, wicketsTaken: 2, maidens: 0,
    },
  }] });
  await show();
  expect(screen.getByText('712')).toBeTruthy();
  expect(screen.getByText('100*')).toBeTruthy();
  expect(screen.getByText('vs Kings')).toBeTruthy();
});
