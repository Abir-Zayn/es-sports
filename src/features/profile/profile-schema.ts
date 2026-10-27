import { z } from 'zod';

/** Bangladeshi mobile: 01 + operator digit 3 to 9 + 8 digits, optionally led by +88 or 88. */
const PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
/** Smart card NIDs have 10 digits, older ones 13 or 17. */
const NATIONAL_ID = /^(?:\d{10}|\d{13}|\d{17})$/;

/** Drops spaces and hyphens, e.g. "017 1234-5678" becomes "01712345678". */
export const stripSeparators = (value: string) => value.replace(/[\s-]/g, '');

/** Optional field: empty is fine, otherwise it must match. Spaces and hyphens are ignored. */
const optionalPattern = (pattern: RegExp, message: string) =>
  z
    .string()
    .trim()
    .transform(stripSeparators)
    .refine((value) => value === '' || pattern.test(value), message);

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Enter your name (at least 2 letters).').max(40, 'Keep your name under 40 characters.'),
  area: z.string().trim().max(40, 'Keep the area under 40 characters.'),
  district: z.string().trim().max(40, 'Keep the district under 40 characters.'),
  /** Empty means not set. */
  bloodGroup: z.enum(['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']),
  phone: optionalPattern(PHONE, 'Enter a valid mobile number, like 01712345678.'),
  nationalId: optionalPattern(NATIONAL_ID, 'Enter a valid National ID (10, 13 or 17 digits).'),
  role: z.enum(['batter', 'bowler', 'all-rounder', 'keeper']),
  battingStyle: z.enum(['right', 'left']),
});

export type ProfileInput = z.infer<typeof profileSchema>;
