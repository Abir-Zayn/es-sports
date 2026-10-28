import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { leagueTable } from '../sample-table';
import { TournamentTableScreen } from '../tournament-table-screen';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 't1' }),
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
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

describe('league table data', () => {
  it('adds up: played is won + lost + no result, and a win is worth 2 points, a no result 1', () => {
    for (const row of leagueTable.rows) {
      expect(row.played).toBe(row.won + row.lost + row.noResult);
      expect(row.points).toBe(row.won * 2 + row.noResult);
    }
  });

  it('is ordered by points, then net run rate, with positions counting up from 1', () => {
    const { rows } = leagueTable;
    rows.forEach((row, i) => {
      expect(row.pos).toBe(i + 1);
      const next = rows[i + 1];
      if (next) {
        expect(row.points > next.points || (row.points === next.points && parseFloat(row.nrr) > parseFloat(next.nrr))).toBe(true);
      }
    });
  });
});

describe('league table screen', () => {
  const show = async () => render(<ThemeProvider><TournamentTableScreen /></ThemeProvider>);

  it('shows the column headings, every team with its figures, and the qualify legend', async () => {
    await show();
    for (const heading of ['#', 'Team', 'P', 'W', 'L', 'NR', 'NRR', 'PTS']) {
      expect(screen.getAllByText(heading).length).toBeGreaterThan(0);
    }
    for (const { team } of leagueTable.rows) expect(screen.getByText(team.name)).toBeTruthy();
    expect(screen.getByText('+1.245')).toBeTruthy();
    expect(screen.getByText('-1.180')).toBeTruthy();
    expect(screen.getByText(leagueTable.qualifyNote)).toBeTruthy();
  });

  it('describes a row to a screen reader, and marks the teams that qualify', async () => {
    await show();
    expect(screen.getByLabelText('1. Chattogram Strikers. Played 5, won 4, lost 1, no result 0, net run rate +1.245, 8 points. Qualify for semi-finals')).toBeTruthy();
    expect(screen.getByLabelText('5. Agrabad Titans. Played 5, won 2, lost 2, no result 1, net run rate +0.050, 5 points')).toBeTruthy();
  });
});
