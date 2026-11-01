import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { seedEvents, seedMatch, seedPlayers } from '../__fixtures__/seed-match';
import { buildLiveView } from '../live/build-live-view';
import type { LiveMatchViewData } from '../live/live-view';
import { sampleLiveView } from '../live/sample-live-view';
import { MatchInfoScreen } from '../match-info-screen';
import { MatchOversScreen } from '../match-overs-screen';
import { MatchScorecardScreen } from '../match-scorecard-screen';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: 'hpl-2026-hss-agt' }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
let mockView: LiveMatchViewData | undefined;
jest.mock('../use-live-match-data', () => ({
  useLiveMatchData: () => ({ data: mockView, isRefetching: false, refetch: jest.fn() }),
}));

const seeded = buildLiveView(seedMatch, seedPlayers, seedEvents);
const show = (ui: ReactNode) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('scorecard tab', () => {
  beforeEach(() => { mockView = seeded; });

  it('opens on the second innings and switches to the first', async () => {
    await show(<MatchScorecardScreen />);
    expect(screen.getByText('Halishahar Strikers vs Agrabad Tigers')).toBeTruthy();
    expect(screen.getByText('c Nayeem b Rashedul')).toBeTruthy();
    await fireEvent.press(screen.getByText('64/2'));
    expect(screen.getByText('c Jahidul b Rakib')).toBeTruthy();
    expect(screen.getByText('(wd 1, nb 1)')).toBeTruthy();
    expect(screen.getByLabelText('1st wicket, Tanvir & Mahmudul, 53 runs')).toBeTruthy();
    expect(screen.getByLabelText('Mahmudul, 1-53 after 4.4 overs')).toBeTruthy();
  });

  it('waits for the first ball before showing a scorecard', async () => {
    mockView = { ...seeded, innings: [] };
    await show(<MatchScorecardScreen />);
    expect(screen.getByText('The scorecard fills in once the first ball is bowled.')).toBeTruthy();
  });
});

describe('overs tab', () => {
  beforeEach(() => { mockView = seeded; });

  it('charts the runs of each over and lists the overs with colour-coded balls', async () => {
    await show(<MatchOversScreen />);
    expect(screen.getByLabelText('Runs per over, overs 1 to 6: 8, 9, 6, 14, 10, 5. Wickets in overs 3, 5, 6.')).toBeTruthy();
    await fireEvent.press(screen.getByText('Halishahar Strikers · 1st innings'));
    expect(screen.getByLabelText(/^Over 6, Jahidul Islam .*5 runs, 64\/2\. Balls: /)).toBeTruthy();
  });

  it('says when no over has been bowled', async () => {
    mockView = { ...seeded, overs: [] };
    await show(<MatchOversScreen />);
    expect(screen.getByText('No overs bowled yet.')).toBeTruthy();
  });
});

describe('info tab', () => {
  it('shows the real toss, format and squads, without the scorer preview', async () => {
    mockView = seeded;
    await show(<MatchInfoScreen />);
    expect(screen.getByLabelText('Halishahar Strikers won the toss and chose to bat')).toBeTruthy();
    expect(screen.getByText('6 overs per side · 8 a side')).toBeTruthy();
    expect(screen.getByLabelText('Rashedul Islam, Bowler')).toBeTruthy();
    expect(screen.queryByText('Scorer panel · preview')).toBeNull();
    expect(screen.queryByText('Watch live')).toBeNull();
  });

  it('keeps the scorer preview and streams for the sample match', async () => {
    mockView = sampleLiveView();
    await show(<MatchInfoScreen />);
    expect(screen.getByText('Scorer panel · preview')).toBeTruthy();
    expect(screen.getByText('Watch live')).toBeTruthy();
  });

  it('says when the toss has not happened', async () => {
    mockView = { ...seeded, info: { ...seeded.info, tossNote: null } };
    await show(<MatchInfoScreen />);
    expect(screen.getByText('The toss has not happened yet.')).toBeTruthy();
  });
});
