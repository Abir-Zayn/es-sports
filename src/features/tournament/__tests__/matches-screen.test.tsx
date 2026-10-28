import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { TournamentMatchesScreen } from '../tournament-matches-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 't1' }),
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

const show = async () => render(<ThemeProvider><TournamentMatchesScreen /></ThemeProvider>);

describe('tournament match schedule', () => {
  beforeEach(() => mockPush.mockClear());

  it('shows upcoming matches under month headings as date tiles with the time on the right', async () => {
    await show();
    for (const text of ['Live now', 'Upcoming', 'Results', 'November']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    // October heads both the upcoming and the finished matches.
    expect(screen.getAllByText('October')).toHaveLength(2);
    // Match 13: Friday the 24th, Riders above Titans, 4:00 PM.
    for (const text of ['24', 'Fri', 'Patenga Riders', 'Agrabad Titans', '4:00 PM', '9:30 AM', '2:30 PM']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    // Four upcoming, one live and two finished matches, each with its own "vs".
    expect(screen.getAllByText('vs')).toHaveLength(7);
    // Upcoming matches have no day label of their own, and a live match has none either.
    expect(screen.queryByText('Fri, 24 Oct')).toBeNull();
    expect(screen.queryByText('Today')).toBeNull();
    expect(screen.getByText('Strikers need 27 runs from 21 balls')).toBeTruthy();
  });

  it('shows the Saturday 25 Oct matches together under October', async () => {
    await show();
    expect(screen.getAllByText('Sat')).toHaveLength(3);
    expect(screen.getAllByText('25')).toHaveLength(2);
  });

  it('shows a finished match with both scores and the time beside the teams, and the result below', async () => {
    await show();
    // Match 11: Strikers 176/6 in 20 overs beat Hawks 158/9 in 20 overs, played at 3:00 PM.
    for (const text of ['176/6(20)', '158/9(20)', '3:00 PM', 'Strikers won by 18 runs', '154/8(20)', '150/9(20)', '9:30 AM']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0);
    }
    expect(screen.getByText('Karnaphuli Kings won by 4 runs')).toBeTruthy();
    // Scores belong to the live match and the two finished ones only, never to an upcoming match.
    expect(screen.getAllByText(/^\d+\/\d+\(/)).toHaveLength(6);
  });

  it('shows the live match as a tile with a LIVE badge by the first team and what the chase needs below', async () => {
    await show();
    expect(screen.getAllByText('LIVE')).toHaveLength(1);
    for (const text of ['168/7(20)', '142/4(16.3)', 'Strikers need 27 runs from 21 balls']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    // The match is on now, so no start time and no day heading above it.
    expect(screen.getByRole('button', { name: /^Match 12, Today, live\. Karnaphuli Kings 168\/7\(20\), Chattogram Strikers 142\/4\(16\.3\)\. Strikers need 27 runs from 21 balls$/ })).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /^Match 12, Today, live/ }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/match/[id]', params: { id: 'm12' } });
  });

  it('filters to one status and drops the group title', async () => {
    await show();
    await fireEvent.press(screen.getByRole('tab', { name: 'Results' }));
    expect(screen.getByText('Karnaphuli Kings won by 4 runs')).toBeTruthy();
    expect(screen.queryByText('4:00 PM')).toBeNull();
    expect(screen.queryByRole('header', { name: 'Results' })).toBeNull();
  });

  it('opens a result on its scorecard, an upcoming match on its info', async () => {
    await show();
    await fireEvent.press(screen.getByRole('button', { name: /Match 11, Yesterday, 3:00 PM\. Chattogram Strikers 176\/6\(20\), Halishahar Hawks 158\/9\(20\)\. Strikers won by 18 runs/ }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/match/[id]/scorecard', params: { id: 'm11' } });
    await fireEvent.press(screen.getByRole('button', { name: /Match 13, Fri, 24 Oct, 4:00 PM/ }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/match/[id]/info', params: { id: 'm13' } });
  });
});
