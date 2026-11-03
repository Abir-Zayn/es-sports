import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { BottomNav, buildNotchBarPath, CREATE_CENTRE_FROM_BAR_BOTTOM, CREATE_SIZE } from '../bottom-nav';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('expo-router/ui', () => {
  const { View } = jest.requireActual('react-native');
  return {
    TabTrigger: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

describe('BottomNav', () => {
  it('exports expected layout constants', () => {
    expect(CREATE_SIZE).toBe(52);
    expect(CREATE_CENTRE_FROM_BAR_BOTTOM).toBe(68);
  });

  it('builds a smooth notch path with valid SVG commands', () => {
    const path = buildNotchBarPath(360, 68);
    expect(path).toContain('M ');
    expect(path).toContain('C ');
    expect(path).toContain('A ');
    expect(path).toContain('Z');
  });

  it('defensively bounds path width for small screens', () => {
    const narrowPath = buildNotchBarPath(100, 68);
    expect(narrowPath).toContain('M ');
    expect(narrowPath).toContain('Z');
  });

  it('renders all navigation tabs and the create button', async () => {
    await render(
      <ThemeProvider>
        <BottomNav onCreate={jest.fn()} />
      </ThemeProvider>,
    );

    expect(screen.getByRole('tab', { name: 'Home' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Tournaments' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Create' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Matches' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Profile' })).toBeTruthy();
  });

  it('fires onCreate when Create button is pressed', async () => {
    const onCreate = jest.fn();
    await render(
      <ThemeProvider>
        <BottomNav onCreate={onCreate} />
      </ThemeProvider>,
    );

    fireEvent.press(screen.getByRole('button', { name: 'Create' }));
    expect(onCreate).toHaveBeenCalledTimes(1);
  });
});
