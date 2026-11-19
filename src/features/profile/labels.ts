import { t, type TranslationKey } from '@/i18n';
import type { BattingStyle, BloodGroup, PlayingRole } from '@/types/profile';

export const roleLabels: Record<PlayingRole, string> = {
  batter: 'Batsman',
  bowler: 'Bowler',
  'all-rounder': 'All-rounder',
  keeper: 'Keeper',
};

export const battingLabels: Record<BattingStyle, string> = {
  right: 'Right-hand bat',
  left: 'Left-hand bat',
};

const ROLE_KEYS: Record<PlayingRole, TranslationKey> = {
  batter: 'profile.role.batter',
  bowler: 'profile.role.bowler',
  'all-rounder': 'profile.role.allRounder',
  keeper: 'profile.role.keeper',
};

const BATTING_KEYS: Record<BattingStyle, TranslationKey> = {
  right: 'profile.batting.right',
  left: 'profile.batting.left',
};

const BATTING_SHORT_KEYS: Record<BattingStyle, TranslationKey> = {
  right: 'profile.batting.rightShort',
  left: 'profile.batting.leftShort',
};

export function roleLabel(role: PlayingRole): string {
  return t(ROLE_KEYS[role]);
}

export function battingLabel(style: BattingStyle): string {
  return t(BATTING_KEYS[style]);
}

export function battingShortLabel(style: BattingStyle): string {
  return t(BATTING_SHORT_KEYS[style]);
}

/** In the order shown in the picker. */
export const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
