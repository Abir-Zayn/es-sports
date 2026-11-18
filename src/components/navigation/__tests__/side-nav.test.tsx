import { fireEvent, render, screen } from '@testing-library/react-native';
import { Share } from 'react-native';

import { HomeSideNav, sideNavItems } from '@/features/home/sections/home-side-nav';
import { ThemeProvider } from '@/theme';

import { SIDE_NAV_WIDTH_RATIO } from '../side-nav';

// Same stub as the radial menu test: the worklets runtime does not exist under Jest, so values apply at once.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const now = (value: unknown) => value;
  return {
    __esModule: true,
    default: { View },
    Easing: { in: now, out: now, cubic: now },
    useAnimatedStyle: (style: () => object) => style(),
    useReducedMotion: () => false,
    useSharedValue: (value: number) => ({ value }),
    withTiming: now,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

const user = { initials: 'TR', name: 'Tanvir Rahman', tone: 'blue' as const };

async function show(open = true) {
  const onClose = jest.fn();
  const onNavigate = jest.fn();
  await render(<ThemeProvider><HomeSideNav open={open} user={user} onClose={onClose} onNavigate={onNavigate} /></ThemeProvider>);
  return { onClose, onNavigate };
}

describe('home side nav', () => {
  it('takes three quarters of the width', () => {
    expect(SIDE_NAV_WIDTH_RATIO).toBe(0.75);
  });

  it('renders nothing while closed', async () => {
    await show(false);
    expect(screen.queryByRole('button', { name: 'My profile' })).toBeNull();
  });

  it('lists the eight places in order under the player’s name', async () => {
    await show();
    expect(screen.getByText('Tanvir Rahman')).toBeTruthy();
    expect(sideNavItems.map((item) => item.label)).toEqual([
      'What’s new', 'My profile', 'Leaderboards', 'Hall of fame', 'Grounds', 'Share the app', 'Cricket blogs', 'Choose language',
    ]);
    for (const item of sideNavItems) expect(screen.getByRole('button', { name: item.label })).toBeTruthy();
  });

  it('closes and navigates when an item is chosen', async () => {
    const { onClose, onNavigate } = await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Leaderboards' }));
    expect(onClose).toHaveBeenCalled();
    expect(onNavigate).toHaveBeenCalledWith('/leaderboards');
  });

  it('opens the share sheet for Share the app', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction', activityType: undefined });
    const { onNavigate } = await show();
    await fireEvent.press(screen.getByRole('button', { name: 'Share the app' }));
    expect(share).toHaveBeenCalledWith({ message: expect.stringContaining('esSports') });
    expect(onNavigate).not.toHaveBeenCalled();
    share.mockRestore();
  });

  it('closes from the dimmed area', async () => {
    const { onClose } = await show();
    // Screen readers stay inside the panel (Back closes it), so the scrim is hidden from them.
    await fireEvent.press(screen.getByLabelText('Close menu', { includeHiddenElements: true }));
    expect(onClose).toHaveBeenCalled();
  });
});
