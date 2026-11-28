import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { sampleLiveView } from '../__fixtures__/sample-live-view';
import { BallMoment, isNewMoment, latestBall } from '../components/ball-moment';
import type { LiveMatchViewData } from '../utils/live-view';

jest.mock('react-native-reanimated', () => require('../__fixtures__/reanimated-stub'));

const withOver = (number: number, balls: string[]): LiveMatchViewData => ({
  ...sampleLiveView(),
  recentOvers: [{ number, bowler: 'Rashedul Islam', to: '', runs: 0, score: '', balls, inProgress: true }],
});

describe('ball moment', () => {
  it('fires only for a newer four, six or wicket', () => {
    const before = latestBall(withOver(5, ['1', '0', '', '', '', '']))!;
    expect(isNewMoment(null, latestBall(withOver(5, ['1', '0', '6', '', '', ''])))).toBe(false);
    expect(isNewMoment(before.order, latestBall(withOver(5, ['1', '0', '6', '', '', ''])))).toBe(true);
    expect(isNewMoment(before.order, latestBall(withOver(5, ['1', '0', 'W', '', '', ''])))).toBe(true);
    expect(isNewMoment(before.order, latestBall(withOver(5, ['1', '0', '2', '', '', ''])))).toBe(false);
    // An undo back to an earlier boundary must not replay it.
    expect(isNewMoment(before.order, latestBall(withOver(5, ['4', '', '', '', '', ''])))).toBe(false);
    expect(isNewMoment(before.order, latestBall(withOver(6, ['4', '', '', '', '', ''])))).toBe(true);
  });

  it('shows nothing on open and the umpire when a six arrives', async () => {
    const ui = (view: LiveMatchViewData) => <ThemeProvider><BallMoment view={view} /></ThemeProvider>;
    const { rerender } = await render(ui(withOver(5, ['4', '', '', '', '', ''])));
    expect(screen.queryByTestId('ball-moment-four', { includeHiddenElements: true })).toBeNull();
    await rerender(ui(withOver(5, ['4', '6', '', '', '', ''])));
    expect(await screen.findByTestId('ball-moment-six', { includeHiddenElements: true })).toBeTruthy();
  });
});
