import type { TranslationKey } from '@/i18n';

const PRIVACY_KEYS: readonly { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'legal.privacy.s1.title', body: 'legal.privacy.s1.body' },
  { title: 'legal.privacy.s2.title', body: 'legal.privacy.s2.body' },
  { title: 'legal.privacy.s3.title', body: 'legal.privacy.s3.body' },
  { title: 'legal.privacy.s4.title', body: 'legal.privacy.s4.body' },
  { title: 'legal.privacy.s5.title', body: 'legal.privacy.s5.body' },
  { title: 'legal.privacy.s6.title', body: 'legal.privacy.s6.body' },
  { title: 'legal.privacy.s7.title', body: 'legal.privacy.s7.body' },
  { title: 'legal.privacy.s8.title', body: 'legal.privacy.s8.body' },
];

export function getPrivacySections(t: (key: TranslationKey) => string): { title: string; body: string }[] {
  return PRIVACY_KEYS.map((item) => ({ title: t(item.title), body: t(item.body) }));
}
