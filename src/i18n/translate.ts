import { bn } from './locales/bn';
import { en, type TranslationDict, type TranslationKey } from './locales/en';
import { getLocale } from './store';
import type { Locale, TranslationParams } from './types';

const dictionaries: Record<Locale, TranslationDict> = { en, bn };

/** Replaces `{{token}}` placeholders in a translation template cleanly. */
export function interpolate(template: string, params?: TranslationParams): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, token: string) => {
    if (!Object.prototype.hasOwnProperty.call(params, token)) return match;
    const value = params[token];
    return value === undefined || value === null ? '' : String(value);
  });
}

/** Translates a typed key for a specific locale, falling back to English if missing. */
export function translate(locale: Locale, key: TranslationKey, params?: TranslationParams): string {
  const dict = dictionaries[locale] ?? en;
  const template = dict[key] ?? en[key];
  return interpolate(template, params);
}

/** Imperative translator reading the current store locale; safe for Zod validators, alerts, and utilities. */
export function t(key: TranslationKey, params?: TranslationParams): string {
  return translate(getLocale(), key, params);
}
