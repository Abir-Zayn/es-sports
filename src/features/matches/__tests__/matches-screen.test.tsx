import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { MatchesScreen } from '../matches-screen';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const show = async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return await render(
    <QueryClientProvider client={client}>
      <ThemeProvider>
        <MatchesScreen />
      </ThemeProvider>
    </QueryClientProvider>,
  );
};

describe('matches tab', () => {
  beforeEach(() => mockPush.mockClear());

  it('lists every upcoming match under month headings, the year only once it changes', async () => {
    await show();
    expect(await screen.findByText('Patenga Riders')).toBeTruthy();
    for (const heading of ['October', 'November', 'December', 'January 2027']) {
      expect(screen.getByText(heading)).toBeTruthy();
    }
    expect(screen.getAllByText('vs')).toHaveLength(6);
    // Upcoming matches carry no score and no LIVE badge.
    expect(screen.queryAllByText(/^\d+\/\d+/)).toHaveLength(0);
    expect(screen.queryByText('LIVE')).toBeNull();
  });

  it('opens an upcoming match on its info screen', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: /^Friendly, Sun, 1 Nov, 3:00 PM/ }));
    expect(mockPush).toHaveBeenLastCalledWith({ pathname: '/match/[id]/info', params: { id: 'f21' } });
  });
});
