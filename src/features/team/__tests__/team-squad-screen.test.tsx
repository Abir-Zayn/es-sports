import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { TeamSquadScreen } from '../team-squad-screen';

afterEach(cleanup);

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'CS' }),
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

describe('team squad screen with Top XI showcase', () => {
  const show = async () =>
    render(
      <ThemeProvider>
        <TeamSquadScreen />
      </ThemeProvider>
    );

  it('does not render the removed match picker bar or callout tile', async () => {
    await show();

    // The "Squad for Match 12" and edit button are removed
    expect(screen.queryByText(/Squad for/i)).toBeNull();
    expect(screen.queryByLabelText(/Edit squad/i)).toBeNull();

    // The callout tile and SVG are removed
    expect(screen.queryByText('Match 12 Starters')).toBeNull();
    expect(screen.queryByText('Tap to inspect')).toBeNull();
  });

  it('renders the Top XI header and 11-slot indicator pill', async () => {
    await show();

    expect(screen.getByText('Top XI Lineup')).toBeTruthy();
    expect(screen.getByLabelText('11 of 11 players in Playing XI')).toBeTruthy();
  });

  it('renders all 11 players in the Top XI disc formation', async () => {
    await show();

    // Check formatted short names on discs
    expect(screen.getByText('T. Hossain')).toBeTruthy();
    expect(screen.getByText('R. Hasan')).toBeTruthy();
    expect(screen.getByText('S. Mahmud')).toBeTruthy();
    expect(screen.getByText('A. Sunny')).toBeTruthy();
    expect(screen.getByText('R. Talukdar')).toBeTruthy();
    expect(screen.getByText('I. Kayes')).toBeTruthy();
    expect(screen.getByText('M. Hossain')).toBeTruthy();
    expect(screen.getByText('S. Ali')).toBeTruthy();
    expect(screen.getByText('L. Roy')).toBeTruthy();
    expect(screen.getByText('A. Javed')).toBeTruthy();
    expect(screen.getByText('N. Islam')).toBeTruthy();

    // Captain and Keeper tags
    expect(screen.getByText('C')).toBeTruthy();
    expect(screen.getByText('WK')).toBeTruthy();
  });

  it('shows Highest Run, Total Matches, Total Wickets, and Avg when a player is clicked', async () => {
    await show();

    const captainDisc = screen.getByLabelText('Rafi Hasan, Batter, Captain');
    await fireEvent.press(captainDisc);

    // Profile sheet appears
    expect(screen.getByText('Player Profile')).toBeTruthy();
    expect(screen.getByText('Rafi Hasan')).toBeTruthy();

    // Shows player result metrics
    expect(screen.getByText('Highest Run')).toBeTruthy();
    expect(screen.getByText('86*')).toBeTruthy();

    expect(screen.getByText('Total Matches')).toBeTruthy();
    expect(screen.getByText('14')).toBeTruthy();

    expect(screen.getByText('Total Wickets')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();

    expect(screen.getByText('Avg')).toBeTruthy();
    expect(screen.getByText('44.5')).toBeTruthy();
  });

  it('toggles the bench section when View Bench is pressed', async () => {
    await show();

    // Bench initially hidden
    expect(screen.queryByText('On bench')).toBeNull();

    // Tap View Bench link
    const benchLink = screen.getByText('View Bench (4 Players)');
    await fireEvent.press(benchLink);

    // Bench section now visible
    expect(screen.getByText('On bench')).toBeTruthy();
    expect(screen.getByText('J Alam')).toBeTruthy();
    expect(screen.getByText('F Reza')).toBeTruthy();
  });
});
