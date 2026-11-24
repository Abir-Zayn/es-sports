import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { emptyDraft } from '../../create/draft';
import { publishSchedule, resetSchedules } from '../schedule-repository';
import { ScheduleBuilder } from '../schedule-builder';
import type { ScheduledMatch } from '../types';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/team', () => ({ useOpenTeam: () => jest.fn() }));
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));

const teams = Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, name: `Team ${i}`, short: `T${i}` }));
const side = (i: number) => ({ kind: 'team' as const, team: teams[i] });
// Round 1 was groups of three; four teams went through to a knockout seeded 0 v 3 and 1 v 2.
const groupMatches: ScheduledMatch[] = [[0, 1], [1, 2], [0, 2], [3, 4], [4, 5], [3, 5]].map(([h, a], i) => ({
  id: `g${i}`, number: i + 1, stage: 'League', round: 0, date: '2099-01-01', startMin: 540 + i * 60, home: side(h), away: side(a), started: true,
}));
const plan = { round: 1, kind: 'knockout' as const, groupIds: null, slots: ['t0', 't3', 't1', 't2'] };

async function show(days: string[]) {
  resetSchedules();
  await publishSchedule('draft:ko', true, 'manual', { perDay: 2, firstStartMin: 540 }, groupMatches);
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } } });
  await render(<ThemeProvider><QueryClientProvider client={client}>
    <ScheduleBuilder tournamentId="draft:ko" setup={{ ...emptyDraft, startDate: days[0], endDate: days[days.length - 1], plan }}
      days={days} teams={teams} isOwner bottomInset={0} />
  </QueryClientProvider></ThemeProvider>);
}

it('shows the knockout pairings and draws every match to the final, keeping the group matches, even in manual mode', async () => {
  await show(['2099-01-01', '2099-01-02', '2099-01-03']);
  expect(await screen.findByText('Round 2 · Knockout')).toBeTruthy();
  expect(screen.getByLabelText('Team 0 against Team 3')).toBeTruthy();
  expect(screen.getByLabelText('Team 1 against Team 2')).toBeTruthy();
  await fireEvent.press(screen.getByText('Draw knockout matches'));
  expect(await screen.findAllByLabelText(/^Match (7|8), Semi-final/)).toHaveLength(2);
  expect(screen.getByLabelText(/^Match 9, Final/)).toBeTruthy();
  expect(screen.getByText('Winner of Match 7')).toBeTruthy();
  expect(screen.getAllByLabelText(/^Match \d, /)).toHaveLength(9);
  expect(screen.queryByText('Round 2 · Knockout')).toBeNull();
});

it('offers only the teams that went through when adding a knockout match by hand', async () => {
  await show(['2099-01-01', '2099-01-02']);
  await fireEvent.press(await screen.findByText('Add match'));
  expect((await screen.findAllByText('T0')).length).toBeGreaterThan(0);
  expect(screen.queryByText('T4')).toBeNull();
  expect(screen.queryByText('T5')).toBeNull();
});

it('says plainly when the tournament has no days left for the knockout', async () => {
  await show(['2099-01-01']);
  await fireEvent.press(await screen.findByText('Draw knockout matches'));
  expect(await screen.findByText('No days are left for this round: the tournament ends on 1 Jan. Move the end date in Edit tournament, then draw again.')).toBeTruthy();
});
