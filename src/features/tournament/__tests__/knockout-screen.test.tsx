import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { tournamentSections } from '../sample-data';
import { sampleKnockoutData } from '../knockout/sample-knockout-data';
import { TournamentKnockoutScreen } from '../knockout/tournament-knockout-screen';

afterEach(cleanup);

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'ucl' }),
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

describe('tournament navigation sections', () => {
  it('places Knockout in tournamentSections between Table and Stats', () => {
    const ids = tournamentSections.map((s) => s.id);
    const tableIndex = ids.indexOf('table');
    const knockoutIndex = ids.indexOf('knockout');
    const statsIndex = ids.indexOf('stats');

    expect(knockoutIndex).toBeGreaterThan(tableIndex);
    expect(knockoutIndex).toBeLessThan(statsIndex);
    expect(tournamentSections.find((s) => s.id === 'knockout')?.label).toBe('Knockout');
  });
});

describe('sample knockout bracket data', () => {
  it('contains the complete draw matching the UEFA Champions League design', () => {
    expect(sampleKnockoutData.name).toBe('UEFA Champions League');
    expect(sampleKnockoutData.season).toBe('2024/25');

    // Draw A
    expect(sampleKnockoutData.drawA.r16).toHaveLength(4);
    expect(sampleKnockoutData.drawA.qf).toHaveLength(2);
    expect(sampleKnockoutData.drawA.sf).toBeTruthy();
    expect(sampleKnockoutData.drawA.finalist.short).toBe('PSG');

    // Match 1: ARS 9 - 3 PSV
    const match1 = sampleKnockoutData.drawA.r16[0];
    expect(match1.home.short).toBe('ARS');
    expect(match1.home.score).toBe('9');
    expect(match1.away.short).toBe('PSV');
    expect(match1.away.score).toBe('3');

    // Final Match: PSG vs INT
    expect(sampleKnockoutData.finalMatch.home.short).toBe('PSG');
    expect(sampleKnockoutData.finalMatch.away.short).toBe('INT');
  });
});

describe('tournament knockout screen', () => {
  const show = async () =>
    render(
      <ThemeProvider>
        <TournamentKnockoutScreen />
      </ThemeProvider>
    );

  it('renders all knockout rounds and match teams from the design', async () => {
    await show();

    // Round titles
    expect(screen.getAllByText('Round of 16').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Quarter final').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Semi final').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Final').length).toBeGreaterThan(0);

    // Filter pills
    expect(screen.getByText('Full Draw')).toBeTruthy();
    expect(screen.getByText('Draw A (PSG Path)')).toBeTruthy();
    expect(screen.getByText('Draw B (Inter Path)')).toBeTruthy();

    // Key match badges & scores from design
    expect(screen.getAllByText('ARS').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PSV').length).toBeGreaterThan(0);
    expect(screen.getAllByText('ATM').length).toBeGreaterThan(0);
    expect(screen.getAllByText('RMA').length).toBeGreaterThan(0);
    expect(screen.getAllByText('LFC').length).toBeGreaterThan(0);
    expect(screen.getAllByText('PSG').length).toBeGreaterThan(0);
    expect(screen.getAllByText('AVL').length).toBeGreaterThan(0);
    expect(screen.getAllByText('BRU').length).toBeGreaterThan(0);
  });

  it('allows switching between draw filters', async () => {
    await show();

    const drawATab = screen.getByLabelText('Draw A (PSG Path)');
    await fireEvent.press(drawATab);
    expect(screen.getAllByText('Round of 16').length).toBe(1);

    const fullDrawTab = screen.getByLabelText('Full Draw');
    await fireEvent.press(fullDrawTab);
    expect(screen.getAllByText('Round of 16').length).toBe(2);
  });
});
