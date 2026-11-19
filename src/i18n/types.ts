export type Locale = 'en' | 'bn';

export const DEFAULT_LOCALE: Locale = 'en';

export const SUPPORTED_LOCALES: readonly Locale[] = ['en', 'bn'] as const;

export type LocaleOption = {
  code: Locale;
  /** Always shown in the language's own script so users can identify it in any state. */
  nativeName: string;
  shortLabel: string;
};

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'en', nativeName: 'English', shortLabel: 'EN' },
  { code: 'bn', nativeName: 'বাংলা', shortLabel: 'বাংলা' },
] as const;

export type TranslationParams = Record<string, string | number>;
