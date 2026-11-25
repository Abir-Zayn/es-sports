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
import { sampleRosters } from '../../roster/__fixtures__/sample-rosters';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({}),
}));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }: { children: ReactNode }) => children,
}));
jest.mock('@/features/auth/components/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'me' } } }) }));
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

async function setSlider(label: string, steps: number) {
  const action = steps >= 0 ? 'increment' : 'decrement';
  for (let i = 0; i < Math.abs(steps); i++) {
    const slider = screen.getByRole('adjustable', { name: label });
    await fireEvent(slider, 'accessibilityAction', { nativeEvent: { actionName: action } });
  }
}

describe('schedule builder', () => {
  beforeEach(async () => {
    resetRosters(sampleRosters());
    resetSchedules();
    jest.mocked(loadDraft).mockResolvedValue(setup);
    await fetchRoster('draft:me', me, parseSetup({ teams: '4' }));
    for (const [name, short] of [['Strikers', 'CS'], ['Kings', 'KK'], ['Riders', 'PR'], ['Hawks', 'HH']]) {
      await createTeam('draft:me', 'me', { name, short });
    }
  });

  it('draws a round robin over the tournament days, two matches a day by default', async () => {
    await show();
    // The summary at the top: status first, then format, teams, dates and matches.
    expect(await screen.findByText('Draft')).toBeTruthy();
    expect(screen.getByLabelText('Format: 20 overs')).toBeTruthy();
    expect(screen.getByLabelText('Teams: 4')).toBeTruthy();
    expect(screen.getByLabelText('Dates: 1 Nov – 10 Nov')).toBeTruthy();
    expect(screen.getByLabelText('Matches: none yet')).toBeTruthy();
    // Nothing to publish until the schedule is drawn.
    expect(screen.queryByRole('button', { name: 'Publish schedule' })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Draw schedule' }));
    expect(await screen.findByLabelText('Matches · 3 days: 6')).toBeTruthy();
    expect(screen.getByText('Tap a match to change it.')).toBeTruthy();
    expect(screen.getByText('Sunday, 1 Nov')).toBeTruthy();
    // Three matches at 9:00 AM, plus the "First match at" setting showing the same time.
    expect(screen.getAllByText('9:00 AM').length).toBe(4);
    expect(screen.getAllByText('1:00 PM').length).toBe(3);
  });

  it('adjusts start time with hour and minute sliders and moves a match', async () => {
    await show();
    await screen.findByLabelText('Format: 20 overs');
    await setSlider('First match hour', 1);
    await setSlider('First match minutes', 15);
    expect(screen.getByText('10:15 AM')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Draw schedule' }));
    expect(screen.getAllByText('10:15 AM').length).toBe(4);

    await fireEvent.press(await screen.findByRole('button', { name: /^Match 3,/ }));
    // Match 3 is on day 2 at 10:15 AM; putting it on day 1 at 10:15 AM collides with Match 1.
    await fireEvent.press(screen.getByRole('radio', { name: 'Sunday 1 November' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByText('Another match is on the ground at that time.')).toBeTruthy();
    await fireEvent.press(screen.getByRole('radio', { name: 'Tuesday 10 November' }));
    await setSlider('Start hour', 1);
    await setSlider('Start minutes', 15);
    expect(screen.getByText('11:30 AM')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Tuesday, 10 Nov')).toBeTruthy();
    expect(screen.getByText('11:30 AM')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Publish schedule' }));
    expect(await screen.findByText('Published. Moving or cancelling a match saves at once and tells both teams.')).toBeTruthy();
    expect(screen.getByText('Published')).toBeTruthy();
  });

  it('says why it cannot draw when the days are too few', async () => {
    jest.mocked(loadDraft).mockResolvedValue({ ...setup, endDate: '2026-11-01' });
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Draw schedule' }));
    expect(await screen.findByText('This needs 3 days, but the tournament runs 1. Play more matches a day or move the end date.')).toBeTruthy();
  });

  it('builds a schedule by hand, allowing 3 matches per team in a day and refusing a 4th', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('tab', { name: 'Manual' }));
    const addMatch = async (opponent: string, hourOffsetFrom9: number) => {
      await fireEvent.press(screen.getByRole('button', { name: 'Add match' }));
      await fireEvent.press(screen.getAllByRole('radio', { name: 'Strikers' })[0]);
      await fireEvent.press(screen.getAllByRole('radio', { name: opponent })[1]);
      await setSlider('Start hour', hourOffsetFrom9);
      await fireEvent.press(screen.getAllByRole('button', { name: 'Add match' }).at(-1)!);
    };

    await addMatch('Kings', -2); // 7:00 AM (Strikers match 1)
    await addMatch('Riders', 2); // 11:00 AM (Strikers match 2)
    await addMatch('Hawks', 6); // 3:00 PM (Strikers match 3)
    expect(await screen.findByLabelText('Matches · 1 day: 3')).toBeTruthy();

    // 4th match for Strikers on the same day at 7:00 PM: ground is free, but Strikers already played 3 times.
    await addMatch('Kings', 10);
    expect(await screen.findByText('A team in this match already plays 3 matches that day.')).toBeTruthy();
  });

  it('after publishing, cancels one match with a reason straight away', async () => {
    await show();
    await fireEvent.press(await screen.findByRole('button', { name: 'Draw schedule' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'Publish schedule' }));
    await screen.findByText(/Published\. Moving or cancelling/);
    await fireEvent.press(screen.getByRole('button', { name: /^Match 2,/ }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel this match' }));
    expect(screen.getByRole('button', { name: 'Cancel match' })).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText('Reason'), 'Ground flooded');
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel match' }));
    expect(await screen.findByRole('button', { name: /Cancelled: Ground flooded/ })).toBeTruthy();
    expect(screen.getByText('Cancelled')).toBeTruthy();
  });
});
