import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import type { ScheduledMatch } from '../../schedule-builder/types';
import { MatchDashboardCard } from '../match-dashboard-card';

jest.mock('@/lib/supabase', () => ({ supabase: { rpc: jest.fn().mockResolvedValue({ data: null, error: null }) } }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));

const team = (id: string, name: string) => ({ kind: 'team', team: { id, name, short: name.slice(0, 3).toUpperCase() } }) as const;
const base: ScheduledMatch = { id: 'f1', number: 3, stage: 'League', round: 0, home: team('a', 'Demo Tigers'), away: team('b', 'Demo Lions'), date: '2030-01-05', startMin: 600 };
const started = { ...base, match: { id: 'm1', status: 'live' } as ScheduledMatch['match'] };
const mods = [{ id: 'mod1', name: 'Moderator Mo', area: null, avatarUrl: null }];

async function show(props: Partial<React.ComponentProps<typeof MatchDashboardCard>>) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const goLive = jest.fn();
  await render(<ThemeProvider><QueryClientProvider client={client}>
    <MatchDashboardCard tournamentId="t1" match={base} streamer={undefined} moderators={mods} viewer={{ userId: 'o', role: 'owner' }} onGoLive={goLive} {...props} />
  </QueryClientProvider></ThemeProvider>);
  return goLive;
}

describe('MatchDashboardCard', () => {
  it('shows the teams, the start and no streamer, and lets the owner choose one', async () => {
    await show({});
    expect(screen.getByText('Demo Tigers  vs  Demo Lions')).toBeTruthy();
    expect(screen.getByText('No streamer chosen yet')).toBeTruthy();
    fireEvent.press(screen.getByText('Choose streamer'));
    expect(await screen.findByText('Moderator Mo')).toBeTruthy();
  });

  it('lets a moderator take an unassigned match', async () => {
    await show({ viewer: { userId: 'mod1', role: 'moderator' } });
    expect(screen.getByText('I will stream this match')).toBeTruthy();
  });

  it('tells the assigned streamer to wait until the match has started', async () => {
    await show({ viewer: { userId: 'mod1', role: 'moderator' }, streamer: { fixtureId: 'f1', streamerId: 'mod1', state: 'assigned', liveAt: null } });
    expect(screen.getByText(/once the match has been started/)).toBeTruthy();
    expect(screen.queryByText('Go live on Facebook')).toBeNull();
  });

  it('offers Go live to the assigned streamer once the match is on, and calls back with the fixture', async () => {
    const goLive = await show({ match: started, viewer: { userId: 'mod1', role: 'moderator' }, streamer: { fixtureId: 'f1', streamerId: 'mod1', state: 'assigned', liveAt: null } });
    expect(screen.getByText('Live now')).toBeTruthy();
    fireEvent.press(screen.getByText('Go live on Facebook'));
    expect(goLive).toHaveBeenCalledWith('f1');
  });

  it('shows the LIVE ON FACEBOOK badge and no streamer buttons to a spectator', async () => {
    await show({ match: started, viewer: { userId: 'x', role: null }, streamer: { fixtureId: 'f1', streamerId: 'mod1', state: 'live', liveAt: 'now' } });
    expect(screen.getByText('LIVE ON FACEBOOK')).toBeTruthy();
    expect(screen.getByText('Streamer: Moderator Mo')).toBeTruthy();
    expect(screen.queryByText('Choose streamer')).toBeNull();
  });
});
