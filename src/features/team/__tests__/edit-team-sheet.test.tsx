import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import type { TeamRecord } from '../data/team-repository';
import { EditTeamSheet } from '../manage/edit-team-sheet';

jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});

const team: TeamRecord = { id: 't', name: 'Sylhet Empire', shortName: 'SE', tone: 'blue', logoUrl: null, area: 'Sylhet', district: null };
const show = async (onSave = jest.fn(), error: string | null = null) => {
  await render(<ThemeProvider><EditTeamSheet team={team} busy={false} error={error} onSave={onSave} onClose={jest.fn()} /></ThemeProvider>);
  return onSave;
};

it('starts with the current details and saves only once something changed', async () => {
  const onSave = await show();
  expect(screen.getByDisplayValue('Sylhet Empire')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();
  await fireEvent.changeText(screen.getByDisplayValue('Sylhet Empire'), 'Sylhet Strikers');
  await fireEvent.changeText(screen.getByDisplayValue('SE'), 'sst');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(onSave).toHaveBeenCalledWith({ name: 'Sylhet Strikers', shortName: 'SST', tone: 'blue', area: 'Sylhet' });
});

it('refuses a name that is too short before sending it', async () => {
  const onSave = await show();
  await fireEvent.changeText(screen.getByDisplayValue('Sylhet Empire'), 'S');
  await fireEvent.press(screen.getByRole('button', { name: 'Save changes' }));
  expect(screen.getByText('Enter a team name of 2 to 40 characters.')).toBeTruthy();
  expect(onSave).not.toHaveBeenCalled();
});

it('shows why the server refused', async () => {
  await show(jest.fn(), 'You are not allowed to do that for this team.');
  expect(screen.getByText('You are not allowed to do that for this team.')).toBeTruthy();
});
