import type { TranslationKey } from '@/i18n';

const TERMS_KEYS: readonly { title: TranslationKey; body: TranslationKey }[] = [
  { title: 'legal.terms.s1.title', body: 'legal.terms.s1.body' },
  { title: 'legal.terms.s2.title', body: 'legal.terms.s2.body' },
  { title: 'legal.terms.s3.title', body: 'legal.terms.s3.body' },
  { title: 'legal.terms.s4.title', body: 'legal.terms.s4.body' },
  { title: 'legal.terms.s5.title', body: 'legal.terms.s5.body' },
  { title: 'legal.terms.s6.title', body: 'legal.terms.s6.body' },
];

export function getTermsSections(t: (key: TranslationKey) => string): { title: string; body: string }[] {
  return TERMS_KEYS.map((item) => ({ title: t(item.title), body: t(item.body) }));
}
