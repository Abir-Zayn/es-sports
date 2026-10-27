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

/** In the order shown in the picker. */
export const bloodGroups: BloodGroup[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
