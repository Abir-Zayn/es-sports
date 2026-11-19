import { z } from 'zod';

import { t, type TranslationKey } from '@/i18n';

/** Bangladeshi mobile: 01 + operator digit 3 to 9 + 8 digits, optionally led by +88 or 88. */
const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
/** Smart card NIDs have 10 digits, older ones 13 or 17. */
const NATIONAL_ID = /^(?:\d{10}|\d{13}|\d{17})$/;

/** Drops spaces and hyphens, e.g. "017 1234-5678" becomes "01712345678". */
export const stripSeparators = (value: string) => value.replace(/[\s-]/g, '');

/** Optional field: empty is fine, otherwise it must match. Spaces and hyphens are ignored. */
const optionalPattern = (pattern: RegExp, key: TranslationKey) =>
  z
    .string()
    .trim()
    .transform(stripSeparators)
    .refine((value) => value === '' || pattern.test(value), { error: () => t(key) });

export const profileSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, { error: () => t('profile.val.nameMin') })
    .max(40, { error: () => t('profile.val.nameMax') }),
  area: z.string().trim().max(40, { error: () => t('profile.val.areaMax') }),
  district: z.string().trim().max(40, { error: () => t('profile.val.districtMax') }),
  /** Empty means not set. */
  bloodGroup: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  phone: optionalPattern(PHONE, 'profile.val.phoneInvalid'),
  nationalId: optionalPattern(NATIONAL_ID, 'profile.val.nidInvalid'),
  role: z.enum(['batter', 'bowler', 'all-rounder', 'keeper']),
  battingStyle: z.enum(['right', 'left']),
});

export type ProfileInput = z.infer<typeof profileSchema>;
