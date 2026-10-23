import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';

import { palettes, type ColorScheme, type Palette, type ThemePreference } from './tokens';

const STORAGE_KEY = 'theme-preference-v2';
// Written by an earlier build whose login toggle could leave the app stuck on "light".
const LEGACY_STORAGE_KEY = 'theme-preference';

type ThemeValue = {
  /** What the user picked: follow the phone, or force light or dark. */
  preference: ThemePreference;
  /** What is actually showing. */
  scheme: ColorScheme;
  colors: Palette;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function isPreference(value: string | null): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    SecureStore.deleteItemAsync(LEGACY_STORAGE_KEY).catch(() => {});
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((stored) => {
        if (isPreference(stored)) setPreferenceState(stored);
      })
      .catch(() => {});
  }, []);

  // Makes native pieces (keyboard, dialogs, system bars) follow the choice too.
  useEffect(() => {
    Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

  // The app is dark-first: when the phone reports no preference, use dark.
  const scheme: ColorScheme = preference === 'system' ? (system === 'light' ? 'light' : 'dark') : preference;

  const value = useMemo(
    () => ({ preference, scheme, colors: palettes[scheme], setPreference }),
    [preference, scheme, setPreference],
  );

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
