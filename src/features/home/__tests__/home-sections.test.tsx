import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { liveMatches } from '../sample-data';
import { LiveSection } from '../sections/live-section';
import { TournamentsToFollow } from '../sections/tournaments-to-follow';
import { UpcomingFixtures } from '../sections/upcoming-fixtures';

const wrap = (node: React.ReactElement) => render(<ThemeProvider>{node}</ThemeProvider>);

describe('Home sections', () => {
  it('shows an empty state with a way forward when nothing is live', async () => {
    const onSeeAll = jest.fn();
    await wrap(<LiveSection matches={[]} onSeeAll={onSeeAll} onMatchPress={jest.fn()} />);
    expect(screen.getByText('No matches live right now')).toBeTruthy();
    await fireEvent.press(screen.getByText('Browse matches'));
    expect(onSeeAll).toHaveBeenCalled();
  });

  it('renders live cards instead of the empty state when matches exist', async () => {
    await wrap(<LiveSection matches={liveMatches} onSeeAll={jest.fn()} onMatchPress={jest.fn()} />);
    expect(screen.queryByText('No matches live right now')).toBeNull();
  });

  it('shows empty states for fixtures and tournaments', async () => {
    await wrap(<UpcomingFixtures fixtures={[]} onAllFixtures={jest.fn()} onRemind={jest.fn()} />);
    expect(screen.getByText('Nothing scheduled')).toBeTruthy();
    await wrap(<TournamentsToFollow tournaments={[]} onTournamentPress={jest.fn()} />);
    expect(screen.getByText('No tournaments yet')).toBeTruthy();
  });
});
