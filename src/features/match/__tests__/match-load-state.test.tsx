import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { MatchLoadState, StaleMatchNote } from '../components/match-load-state';
import { MatchNotFoundError } from '../use-live-match-data';

jest.mock('@/features/scoring/data/match-repository', () => ({}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const query = (overrides: Partial<{ error: unknown; isError: boolean; isFetching: boolean }> = {}) =>
  ({ error: null, isError: false, isFetching: false, refetch: jest.fn(), ...overrides });

describe('a match that has not loaded', () => {
  it('shows a spinner while it loads', async () => {
    await render(<ThemeProvider><MatchLoadState query={query()} label="Loading scorecard" /></ThemeProvider>);
    expect(screen.getByLabelText('Loading scorecard')).toBeTruthy();
  });

  it('says the connection failed and retries on request', async () => {
    const failed = query({ isError: true, error: new Error('offline') });
    await render(<ThemeProvider><MatchLoadState query={failed} label="Loading scorecard" /></ThemeProvider>);
    expect(screen.getByText(/Could not load this match/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(failed.refetch).toHaveBeenCalledTimes(1);
  });

  it('says a missing match cannot be found, without a retry', async () => {
    await render(<ThemeProvider>
      <MatchLoadState query={query({ isError: true, error: new MatchNotFoundError() })} label="Loading scorecard" />
    </ThemeProvider>);
    expect(screen.getByText(/could not be found/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Try again' })).toBeNull();
  });

  it('notes when the last refresh failed and an older score is shown', async () => {
    await render(<ThemeProvider><StaleMatchNote query={{ isRefetchError: true }} /></ThemeProvider>);
    expect(screen.getByText('Could not refresh. Showing the last saved score.')).toBeTruthy();
  });
});
