import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { format } from 'date-fns';
import type { ReactNode } from 'react';

import { fetchMyTeams } from '@/features/team';
import { ThemeProvider } from '@/theme';

import { fetchCalendarFixtures, formatStart, monthGrid, toCalendarFixture } from '../calendar-repository';
import { CalendarScreen } from '../calendar-screen';

const mockPush = jest.fn();
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn(), canGoBack: () => true }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/team/data/team-repository', () => ({
  ...jest.requireActual('@/features/team/data/team-repository'),
  fetchMyTeams: jest.fn(),
}));
jest.mock('../calendar-repository', () => ({ ...jest.requireActual('../calendar-repository'), fetchCalendarFixtures: jest.fn() }));

const today = format(new Date(), 'yyyy-MM-dd');
const team = { id: 't1', name: 'Crystal Palace', shortName: 'CP', tone: 'neutral' as const, logoUrl: null, area: null, district: null, myRole: 'player' as const };
const fixture = {
  id: 'f1', date: today, startMin: 990, home: 'Crystal Palace', away: 'Patenga Riders', tournamentId: 'tour-1',
  tournamentName: 'HSF Premier League', stage: 'League', cancelled: false, matchId: null,
};

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  await render(<ThemeProvider><QueryClientProvider client={client}><CalendarScreen /></QueryClientProvider></ThemeProvider>);
}

describe('calendar helpers', () => {
  it('fills whole Sunday-first weeks around the month', () => {
    const days = monthGrid(new Date('2026-11-01T00:00:00'));
    expect(days.length % 7).toBe(0);
    expect(days[0].getDay()).toBe(0);
    expect(format(days[0], 'yyyy-MM-dd')).toBe('2026-11-01');
    expect(format(days[days.length - 1], 'yyyy-MM-dd')).toBe('2026-12-05');
  });

  it('formats start times and survives bad input', () => {
    expect(formatStart(990)).toBe('4:30 PM');
    expect(formatStart(0)).toBe('12:00 AM');
    expect(formatStart(Number.NaN)).toBe('12:00 AM');
  });

  it('falls back to labels when a side has no team yet', () => {
    const row = { id: 'f', match_date: '2026-11-20', start_min: 600, stage: 'Final', status: 'cancelled', match_id: null,
      home_label: 'Winner SF1', away_label: null, tournament_id: 't', home: null, away: { name: 'Hawks' }, tournaments: null };
    expect(toCalendarFixture(row)).toMatchObject({ home: 'Winner SF1', away: 'Hawks', cancelled: true, tournamentName: 'Tournament' });
  });
});

describe('calendar screen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists today’s game and opens its tournament before it starts', async () => {
    jest.mocked(fetchMyTeams).mockResolvedValue([team]);
    jest.mocked(fetchCalendarFixtures).mockResolvedValue([fixture]);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: /Crystal Palace versus Patenga Riders/ }));
    expect(fetchCalendarFixtures).toHaveBeenCalledWith(['t1'], today.slice(0, 7));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/tournament/[id]', params: { id: 'tour-1' } });
    expect(screen.getByLabelText(/has games/)).toBeTruthy();
  });

  it('says when the chosen day has no games', async () => {
    jest.mocked(fetchMyTeams).mockResolvedValue([team]);
    jest.mocked(fetchCalendarFixtures).mockResolvedValue([]);
    await show();
    expect(await screen.findByText('No games on this day.')).toBeTruthy();
  });

  it('asks a player without a team to find one', async () => {
    jest.mocked(fetchMyTeams).mockResolvedValue([]);
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Find a team' }));
    expect(fetchCalendarFixtures).not.toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/search');
  });

  it('offers a retry when loading fails', async () => {
    jest.mocked(fetchMyTeams).mockRejectedValue(new Error('offline'));
    await show();
    expect(await screen.findByText('Couldn’t load your games.')).toBeTruthy();
  });
});
