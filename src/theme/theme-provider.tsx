import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { palettes, type ColorScheme, type Palette } from './tokens';

type ThemeValue = { scheme: ColorScheme; colors: Palette };
const ThemeContext = createContext<ThemeValue | null>(null);

/** Always follows the device. Stored preferences from older versions are intentionally ignored. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const scheme: ColorScheme = system === 'light' ? 'light' : 'dark';
  const value = useMemo(() => ({ scheme, colors: palettes[scheme] }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside <ThemeProvider>.');
  return value;
}

/** Builds styles from the current palette, rebuilt only when the theme changes. */
export function useThemedStyles<T>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
