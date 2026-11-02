import { act, fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { RadialCreateMenu } from '../radial-create-menu';

// Reanimated's worklets runtime does not exist under Jest (and its mock still loads it without a global resolver), so
// stub the few calls the menu makes: values apply at once, as with reduced motion.
jest.mock('react-native-reanimated', () => {
  const { View } = jest.requireActual('react-native');
  const now = (value: unknown) => value;
  return {
    __esModule: true,
    default: { View },
    Easing: { in: now, cubic: now },
    useAnimatedStyle: (style: () => object) => style(),
    useReducedMotion: () => false,
    useSharedValue: (value: number) => ({ value }),
    withSpring: now,
    withTiming: now,
  };
});
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('radial create menu', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('renders nothing while closed', async () => {
    await render(<ThemeProvider><RadialCreateMenu open={false} onChoose={jest.fn()} onClose={jest.fn()} /></ThemeProvider>);
    expect(screen.queryByRole('button', { name: 'Create Tournament' })).toBeNull();
  });

  it('offers a tournament or a friendly match, and closes from the button or the scrim', async () => {
    const onChoose = jest.fn();
    const onClose = jest.fn();
    await render(<ThemeProvider><RadialCreateMenu open onChoose={onChoose} onClose={onClose} /></ThemeProvider>);
    await fireEvent.press(await screen.findByRole('button', { name: 'Create Tournament' }));
    expect(onChoose).toHaveBeenLastCalledWith('tournament');
    await fireEvent.press(screen.getByRole('button', { name: 'Friendly Match' }));
    expect(onChoose).toHaveBeenLastCalledWith('friendly');
    await fireEvent.press(screen.getByRole('button', { name: 'Close create menu' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Dismiss create menu' }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('unmounts after closing', async () => {
    const view = await render(<ThemeProvider><RadialCreateMenu open onChoose={jest.fn()} onClose={jest.fn()} /></ThemeProvider>);
    expect(await screen.findByRole('button', { name: 'Friendly Match' })).toBeTruthy();
    await view.rerender(<ThemeProvider><RadialCreateMenu open={false} onChoose={jest.fn()} onClose={jest.fn()} /></ThemeProvider>);
    await act(async () => { jest.advanceTimersByTime(500); });
    expect(screen.queryByRole('button', { name: 'Friendly Match' })).toBeNull();
  });
});
