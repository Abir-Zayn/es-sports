import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { TournamentOverviewScreen } from '../tournament-overview-screen';

const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 't1' }),
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: mockReplace, canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const show = async () => render(<ThemeProvider><TournamentOverviewScreen /></ThemeProvider>);

describe('tournament overview', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  it('centres the name over one chip per part of the format line, and the status', async () => {
    await show();
    expect(screen.getByRole('header', { name: 'HSF Premier League 2026' })).toBeTruthy();
    for (const chip of ['League + Knockout', 'T20', '8 teams', 'Halishahar Ground', 'Ongoing']) {
      expect(screen.getByText(chip)).toBeTruthy();
    }
  });

  it('toggles follow', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Follow' }));
    expect(screen.getByRole('button', { name: 'Following' })).toBeTruthy();
  });

  it('shows how far the season has run', async () => {
    await show();
    expect(screen.getByLabelText('11 of 31 matches played. 8 teams, final on 30 Nov')).toBeTruthy();
    for (const text of ['11/31 played', '20', '30 Nov']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
  });

  it('lists three leaders under Top Performance, each with name, award and figure', async () => {
    await show();
    for (const label of [
      'Highest runs: Rafi Hasan, 312 runs',
      'Highest wickets: Nayeem Islam, 14 wickets',
      'Highest team total: Chattogram Strikers, 176/6 20 overs',
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it('shows recent results as match tiles that open the scorecard', async () => {
    await show();
    for (const text of ['176/6(20)', '158/9(20)', 'Strikers won by 18 runs', 'Karnaphuli Kings won by 4 runs']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    await fireEvent.press(screen.getByRole('button', { name: /^Match 11, Yesterday/ }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/match/[id]/scorecard', params: { id: 'm11' } });
  });

  it('opens the full table from standings', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Full table' }));
    expect(mockReplace).toHaveBeenLastCalledWith({ pathname: '/tournament/[id]/table', params: { id: 't1' } });
  });
});
