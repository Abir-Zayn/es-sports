import { render, screen } from '@testing-library/react-native';
import { Text, useColorScheme } from 'react-native';

import { ThemeProvider, useTheme } from '../theme-provider';
import { palettes } from '../tokens';

jest.mock('react-native/Libraries/Utilities/useColorScheme', () => ({ __esModule: true, default: jest.fn() }));

function Probe() {
  const { scheme, colors } = useTheme();
  return <Text>{`${scheme}:${colors.background}`}</Text>;
}

test('tracks changes to the device color scheme', async () => {
  const scheme = jest.mocked(useColorScheme);
  scheme.mockReturnValue('light');
  const view = await render(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText(`light:${palettes.light.background}`)).toBeTruthy();

  scheme.mockReturnValue('dark');
  await view.rerender(<ThemeProvider><Probe /></ThemeProvider>);
  expect(screen.getByText(`dark:${palettes.dark.background}`)).toBeTruthy();
});
