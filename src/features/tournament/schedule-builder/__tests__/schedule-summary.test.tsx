import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { ScheduleSummary } from '../components/schedule-summary';

const show = (over: Partial<Parameters<typeof ScheduleSummary>[0]> = {}) => render(
  <ThemeProvider>
    <ScheduleSummary status="published" viewOnly={false} format="20 overs" teams={4} dates="1 Nov – 10 Nov" matches={6} days={3} {...over} />
  </ThemeProvider>,
);

describe('schedule summary', () => {
  it('leads with the status, then the facts as labelled figures', async () => {
    await show();
    expect(screen.getByText('Published')).toBeTruthy();
    expect(screen.getByLabelText('Teams: 4')).toBeTruthy();
    expect(screen.getByLabelText('Matches · 3 days: 6')).toBeTruthy();
    expect(screen.queryByText('View only')).toBeNull();
  });

  it('tells staff who cannot edit that the schedule is view only', async () => {
    await show({ viewOnly: true, status: 'underway', matches: 1, days: 1 });
    expect(screen.getByText('View only')).toBeTruthy();
    expect(screen.getByText('Under way')).toBeTruthy();
    expect(screen.getByLabelText('Matches · 1 day: 1')).toBeTruthy();
  });
});
