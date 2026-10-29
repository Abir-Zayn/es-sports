import { render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import type { LiveMatchViewData } from '../live/live-view';
import { sampleLiveView } from '../live/sample-live-view';
import { MatchLiveScreen } from '../match-live-screen';
import { MatchWagonScreen } from '../match-wagon-screen';

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
const showing = (view: LiveMatchViewData) => { mockView = view; };

/** A short live chase: the view is built by hand from the sample, with real-looking team lines. */
function liveChase(): LiveMatchViewData {
  const sample = sampleLiveView();
  return {
    ...sample, source: 'stored', stream: null,
    header: { ...sample.header, title: 'Halishahar Strikers vs Agrabad Tigers', label: 'FRIENDLY · 6 OVERS', toss: 'Agrabad Tigers won the toss and chose to bowl' },
    summary: 'Strikers need 13 runs in 12 balls',
    recentOvers: [{ number: 5, bowler: 'Rashedul Islam', to: 'to Liton Roy · in progress', runs: 11, score: '40/2', balls: ['4', '6', 'W', '0', '1', ''], inProgress: true }],
  };
}

async function show(ui: ReactNode) {
  await render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe('live spectator screen', () => {
  beforeEach(() => { mockView = undefined; });

  it('shows the chase, the toss, the crease and the colour-coded over', async () => {
    showing(liveChase());
    await show(<MatchLiveScreen />);
    expect(await screen.findByText('Strikers need 13 runs in 12 balls')).toBeTruthy();
    expect(screen.getByText('LIVE')).toBeTruthy();
    expect(screen.getByText('Agrabad Tigers won the toss and chose to bowl')).toBeTruthy();
    expect(screen.getByText('Rafi Hasan')).toBeTruthy();
    expect(screen.getByLabelText('Over 5: four, six, wicket, dot ball, 1 run')).toBeTruthy();
    expect(screen.queryByText(/Preview match/)).toBeNull();
  });

  it('shows a finished match as a result without a required rate', async () => {
    showing({ ...liveChase(), header: { ...liveChase().header, status: 'completed' }, summary: 'Halishahar Strikers won by 12 runs', requiredRunRate: null });
    await show(<MatchLiveScreen />);
    expect(await screen.findByText('Halishahar Strikers won by 12 runs')).toBeTruthy();
    expect(screen.getByText('RESULT')).toBeTruthy();
    expect(screen.queryByText(/RRR/)).toBeNull();
  });

  it('says when it is showing the preview match', async () => {
    showing(sampleLiveView());
    await show(<MatchLiveScreen />);
    expect(await screen.findByText(/Preview match/)).toBeTruthy();
  });
});

describe('wagon screen', () => {
  beforeEach(() => { mockView = undefined; });

  it('draws the recorded shots of the real match with their zone split', async () => {
    showing({ ...liveChase(), wagonBatters: [{ id: 'liton', name: 'Liton Roy', line: '24* (14) · 3×4, 0×6', shots: [{ runs: 4, angle: 0 }, { runs: 2, angle: 180 }] }] });
    await show(<MatchWagonScreen />);
    expect(await screen.findByText('Liton Roy')).toBeTruthy();
    expect(screen.getByText('Halishahar Strikers vs Agrabad Tigers')).toBeTruthy();
    expect(screen.getByLabelText('Off side: 4 runs from 1 shots, 67 percent')).toBeTruthy();
  });

  it('explains when no shot directions were recorded', async () => {
    showing({ ...liveChase(), wagonBatters: [] });
    await show(<MatchWagonScreen />);
    expect(await screen.findByText(/No shot directions recorded yet/)).toBeTruthy();
  });
});
