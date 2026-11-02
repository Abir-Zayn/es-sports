import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as Clipboard from 'expo-clipboard';

import { ThemeProvider } from '@/theme';

import { CopyIdButton } from '../components/copy-id-button';
import { ProfileHeader } from '../sections/profile-header';
import { sampleProfile } from '../sample-data';

jest.mock('expo-clipboard', () => ({ setStringAsync: jest.fn() }));

const ID = '5e1f0000-0000-4000-8000-000000000001';
const set = jest.mocked(Clipboard.setStringAsync);
const show = async (ui: React.ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

beforeEach(() => set.mockReset().mockResolvedValue(true));

describe('copying the user id', () => {
  it('puts the full user id on the clipboard and confirms', async () => {
    await show(<CopyIdButton userId={ID} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Copy user ID' }));
    expect(set).toHaveBeenCalledWith(ID);
    expect(await screen.findByRole('button', { name: 'User ID copied' })).toBeTruthy();
  });

  it('does not claim it copied when the device refuses', async () => {
    set.mockRejectedValue(new Error('denied'));
    await show(<CopyIdButton userId={ID} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Copy user ID' }));
    expect(await screen.findByRole('button', { name: 'Could not copy the user ID' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'User ID copied' })).toBeNull();
  });

  it('sits beside the name on the profile, and is absent until the account is known', async () => {
    const noop = jest.fn();
    const { rerender } = await show(<ProfileHeader profile={sampleProfile.profile} userId={ID} onSettings={noop} onEdit={noop} />);
    expect(screen.getByText(sampleProfile.profile.fullName)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Copy user ID' }));
    await waitFor(() => expect(set).toHaveBeenCalledWith(ID));
    await rerender(<ThemeProvider><ProfileHeader profile={sampleProfile.profile} onSettings={noop} onEdit={noop} /></ThemeProvider>);
    expect(screen.queryByRole('button', { name: /user ID/ })).toBeNull();
  });
});
