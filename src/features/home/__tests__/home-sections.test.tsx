import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import type { LiveMatch } from '@/types/cricket';

import { LiveSection } from '../sections/live-section';
import { TournamentsToFollow } from '../sections/tournaments-to-follow';
import { UpcomingFixtures } from '../sections/upcoming-fixtures';

const wrap = (node: React.ReactElement) => render(<ThemeProvider>{node}</ThemeProvider>);

const liveMatch: LiveMatch = {
  id: 'm1',
  label: 'FRIENDLY MATCH',
  status: 'Riders need 10 runs from 12 balls',
  teams: [
    { short: 'KK', name: 'Karnaphuli Kings', tone: 'yellow', score: '60/3', overs: '(6)', batting: false },
    { short: 'PR', name: 'Patenga Riders', tone: 'blue', score: '51/2', overs: '(4)', batting: true },
  ],
  balls: [],
};

describe('Home sections', () => {
  it('shows an empty state with a way forward when nothing is live', async () => {
    const onSeeAll = jest.fn();
    await wrap(<LiveSection matches={[]} status="ready" onRetry={jest.fn()} onSeeAll={onSeeAll} onMatchPress={jest.fn()} />);
    expect(screen.getByText('No matches live right now')).toBeTruthy();
    await fireEvent.press(screen.getByText('Browse matches'));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it('renders live cards without a this-over row when no balls are loaded', async () => {
    await wrap(<LiveSection matches={[liveMatch]} status="ready" onRetry={jest.fn()} onSeeAll={jest.fn()} onMatchPress={jest.fn()} />);
    expect(screen.getByText('Riders need 10 runs from 12 balls')).toBeTruthy();
    expect(screen.queryByText('This over')).toBeNull();
  });

  it('shows a placeholder while loading and a retry on error', async () => {
    const onRetry = jest.fn();
    await wrap(<LiveSection matches={[]} status="loading" onRetry={onRetry} onSeeAll={jest.fn()} onMatchPress={jest.fn()} />);
    expect(screen.getByLabelText('Loading live matches')).toBeTruthy();
    await wrap(<LiveSection matches={[]} status="error" onRetry={onRetry} onSeeAll={jest.fn()} onMatchPress={jest.fn()} />);
    await fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows empty states for fixtures and tournaments', async () => {
    await wrap(<UpcomingFixtures fixtures={[]} status="ready" onRetry={jest.fn()} onFixturePress={jest.fn()} onAllFixtures={jest.fn()} onRemind={jest.fn()} />);
    expect(screen.getByText('Nothing scheduled')).toBeTruthy();
    await wrap(<TournamentsToFollow tournaments={[]} status="ready" onRetry={jest.fn()} onTournamentPress={jest.fn()} />);
    expect(screen.getByText('No tournaments running')).toBeTruthy();
  });
});
