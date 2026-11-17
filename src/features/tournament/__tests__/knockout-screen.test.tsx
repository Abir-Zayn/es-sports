import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { fake } from '../__fixtures__/supabase-fake';
import type { TournamentRecord } from '../data/tournament-repository';
import { RealKnockout } from '../knockout/real-knockout';
import { tournamentSections } from '../sample-data';
import { sampleKnockoutData } from '../knockout/sample-knockout-data';
import { TournamentKnockoutScreen } from '../knockout/tournament-knockout-screen';

afterEach(cleanup);

jest.mock('@/lib/supabase', () => ({ supabase: jest.requireActual('../__fixtures__/supabase-fake').fake }));

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

describe('sample bracket accessibility', () => {
  it('reads each match card as round, score, status and winner', async () => {
    await render(<ThemeProvider><TournamentKnockoutScreen /></ThemeProvider>);
    expect(screen.getAllByLabelText('Round of 16: Arsenal 9, PSV Eindhoven 3, full time. Arsenal won').length).toBeGreaterThan(0);
    expect(screen.getByLabelText('Final: Paris Saint-Germain 2, Inter Milan 1, full time. Paris Saint-Germain won')).toBeTruthy();
    expect(screen.getByText('Champion: Paris Saint-Germain')).toBeTruthy();
  });
});

describe('real tournament knockout', () => {
  const team = (id: string, name: string, eliminated: boolean) => ({
    team_id: id, eliminated_at: eliminated ? '2026-11-12T10:00:00Z' : null,
    teams: { id, name, short_name: name.slice(0, 3).toUpperCase(), tone: 'blue', logo_url: null, area: null, district: null },
  });
  const show = async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    await render(
      <ThemeProvider><QueryClientProvider client={client}><RealKnockout tournament={{ id: 'k1' } as TournamentRecord} /></QueryClientProvider></ThemeProvider>
    );
  };
  beforeEach(() => {
    fake.reset();
    fake.results.team_members = { data: [], error: null };
  });

  it('splits teams into still in and eliminated, in words not only colour', async () => {
    fake.results.tournament_teams = { data: [team('a', 'Alpha XI', false), team('b', 'Bravo XI', false), team('c', 'Charlie XI', true)], error: null };
    await show();
    expect(await screen.findByText('2 of 3 teams still in')).toBeTruthy();
    expect(screen.getByText('Still in · 2')).toBeTruthy();
    expect(screen.getByText('Eliminated · 1')).toBeTruthy();
    expect(screen.getByLabelText('Charlie XI, eliminated')).toBeTruthy();
    expect(screen.getByLabelText('Alpha XI, still in')).toBeTruthy();
  });

  it('names the champion when one team is left', async () => {
    fake.results.tournament_teams = { data: [team('a', 'Alpha XI', false), team('b', 'Bravo XI', true)], error: null };
    await show();
    expect(await screen.findByText('Alpha XI won')).toBeTruthy();
    expect(screen.getByLabelText('Alpha XI, champion')).toBeTruthy();
  });

  it('explains the empty state before any team joins', async () => {
    fake.results.tournament_teams = { data: [], error: null };
    await show();
    expect(await screen.findByText('No teams yet')).toBeTruthy();
  });

  it('offers a retry when the teams cannot be loaded', async () => {
    fake.results.tournament_teams = { data: null, error: { message: 'down', code: '500' } };
    await show();
    expect(await screen.findByText('Could not load the teams.')).toBeTruthy();
    expect(screen.getByText('Try again')).toBeTruthy();
  });
});
