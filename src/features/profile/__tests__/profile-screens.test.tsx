import { render, screen, waitFor } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { loadLinkedAccounts } from '@/features/auth/linked-accounts';
import { ThemeProvider } from '@/theme';

import { EditProfileScreen } from '../edit-profile-screen';
import { sampleProfile } from '../sample-data';
import { ProfileScreen } from '../profile-screen';
import { SettingsScreen } from '../settings-screen';

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  usePreventRemove: () => jest.fn(),
}));
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));
jest.mock('react-native-safe-area-context', () => {
  const { View } = jest.requireActual('react-native');
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock('@/components/navigation/bottom-nav', () => ({ BOTTOM_NAV_CLEARANCE: 100 }));
jest.mock('@/features/auth/auth-provider', () => ({ useAuth: () => ({ session: { user: { id: 'u1', email: 'player@example.com' } } }) }));
jest.mock('@/features/auth/sign-out', () => ({ signOut: jest.fn() }));
jest.mock('@/features/auth/google-auth', () => ({ linkGoogleAccount: jest.fn(), signInWithGoogle: jest.fn() }));
jest.mock('@/features/auth/linked-accounts', () => ({ loadLinkedAccounts: jest.fn() }));
jest.mock('@/features/profile/profile-provider', () => ({
  useProfile: () => ({
    ...jest.requireActual('../sample-data').sampleProfile,
    status: 'ready',
    reload: jest.fn(),
    saveProfile: jest.fn(),
    importFromProvider: jest.fn(),
  }),
}));

const linked = jest.mocked(loadLinkedAccounts);
const withTheme = async (ui: ReactElement) => render(<ThemeProvider>{ui}</ThemeProvider>);

describe('profile screens render without errors', () => {
  it('Settings, with Google linked', async () => {
    linked.mockResolvedValue({ ok: true, accounts: { hasEmail: true, google: { fullName: 'Tanvir', avatarUrl: 'https://x/a.jpg' } } });
    await withTheme(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('Linked')).toBeTruthy());
    for (const title of ['Change password', 'Google', 'Notifications', 'Terms and Conditions', 'Privacy Policy', 'Version', 'Log out', 'Delete account']) {
      expect(screen.getByText(title)).toBeTruthy();
    }
    // The sign-in email row is also called "Email", so the account list has two.
    expect(screen.getAllByText('Email')).toHaveLength(2);
    // Every tile is in one list.
    expect(screen.getAllByRole('button', { name: 'Notifications' })).toHaveLength(1);
    expect(screen.getByText('Connected')).toBeTruthy();
    expect(screen.queryByText('Email and password')).toBeNull();
    expect(screen.queryByText('Legal')).toBeNull();
    expect(screen.queryByText('About')).toBeNull();
    expect(screen.getByLabelText('Import name and photo from Google')).toBeTruthy();
    expect(screen.queryByText(/Added your name/)).toBeNull();
    // The groups have no heading, and the appearance switch has no visible title or icon.
    expect(screen.queryByText('Connected Accounts')).toBeNull();
    expect(screen.queryByText('Preferences')).toBeNull();
    expect(screen.queryByText('Appearance')).toBeNull();
    expect(screen.getByLabelText('Appearance')).toBeTruthy();
    expect(screen.getByText('System')).toBeTruthy();
  });

  it('Settings, with Google not linked, offers Link and no import button', async () => {
    linked.mockResolvedValue({ ok: true, accounts: { hasEmail: true, google: null } });
    await withTheme(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('Link')).toBeTruthy());
    expect(screen.queryByLabelText('Import name and photo from Google')).toBeNull();
  });

  it('Settings shows a failure to load linked accounts', async () => {
    linked.mockResolvedValue({ ok: false, message: 'Couldn’t load your linked accounts.' });
    await withTheme(<SettingsScreen />);
    await waitFor(() => expect(screen.getByText('Couldn’t load your linked accounts.')).toBeTruthy());
  });

  it('Profile tab', async () => {
    await withTheme(<ProfileScreen />);
    expect(screen.getByText(sampleProfile.profile.fullName)).toBeTruthy();
    expect(screen.getByText('Personal Info')).toBeTruthy();
  });

  it('Edit profile', async () => {
    await withTheme(<EditProfileScreen />);
    expect(screen.getByText('Edit Profile')).toBeTruthy();
    expect(screen.getByText('Batsman')).toBeTruthy();
    expect(screen.getByText('Blood group')).toBeTruthy();
  });
});
