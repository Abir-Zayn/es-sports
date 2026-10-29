import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { ThemeProvider } from '@/theme';

import { emptyDraft } from '../../create/draft';
import { loadDraft } from '../../create/draft-storage';
import { createTeam, fetchRoster, resetRosters } from '../../roster/roster-repository';
import { parseSetup } from '../../roster/setup';
import { resetSchedules } from '../schedule-repository';
import { ScheduleBuilderScreen } from '../schedule-builder-screen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
jest.mock('@/features/profile/profile-provider', () => ({ useProfile: () => ({ profile: { fullName: 'Organiser Me' } }) }));
jest.mock('../../create/draft-storage', () => ({ loadDraft: jest.fn(), draftQueryKey: (id: string) => ['tournament-draft', id] }));

const setup = { ...emptyDraft, name: 'Port City Cup', venue: 'Main Ground', startDate: '2026-11-01', endDate: '2026-11-10', competition: 'league' as const, teams: 4 as const };
const me = { id: 'me', name: 'Organiser Me', area: null, avatarUrl: null };

async function show() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } } });
  await render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ScheduleBuilderScreen />
      </QueryClientProvider>
    </ThemeProvider>,
  );
}

describe('schedule builder', () => {
  beforeEach(async () => {
    resetRosters();
    resetSchedules();
    jest.mocked(loadDraft).mockResolvedValue(setup);
    await fetchRoster('draft:me', me, parseSetup({ teams: '4' }));
    for (const [name, short] of [['Strikers', 'CS'], ['Kings', 'KK'], ['Riders', 'PR'], ['Hawks', 'HH']]) {
      await createTeam('draft:me', 'me', { name, short });
    }
  });

  it('draws a round robin over the tournament days, two matches a day by default', async () => {
    await show();
    expect(await screen.findByText('Round robin · T20 · 4 teams · 1 Nov – 10 Nov')).toBeTruthy();
    // Nothing to publish until the schedule is drawn.
    expect(screen.queryByRole('button', { name: 'Publish schedule' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Draw schedule' }));
    expect(await screen.findByText('6 matches over 3 days. Tap a match to move it.')).toBeTruthy();
    expect(screen.getByText('Sunday, 1 Nov')).toBeTruthy();
    // Three matches at 9:00 AM, plus the "First match at" setting showing the same time.
    expect(screen.getAllByText('9:00 AM').length).toBe(4);
    expect(screen.getAllByText('1:00 PM').length).toBe(3);
  });

  it('moves a match, refusing a clash first, then publishes', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Draw schedule' }));
    await fireEvent.press(await screen.findByRole('button', { name: /^Match 3,/ }));
    // Match 3 is on day 2; putting it on day 1 at 9:00 AM collides with Match 1.
    await fireEvent.press(screen.getByRole('radio', { name: 'Sunday 1 November' }));
    await fireEvent.press(screen.getByRole('radio', { name: 'Start at 9:00 AM' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Another match is on the ground at that time.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Tuesday 10 November' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Tuesday, 10 Nov')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Publish schedule' }));
    expect(await screen.findByText('Published. Teams and followers can see it.')).toBeTruthy();
  });

  it('says why it cannot draw when the days are too few', async () => {
    jest.mocked(loadDraft).mockResolvedValue({ ...setup, endDate: '2026-11-01' });
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Draw schedule' }));
    expect(await screen.findByText('This needs 3 days, but the tournament runs 1. Play more matches a day or move the end date.')).toBeTruthy();
  });
});
