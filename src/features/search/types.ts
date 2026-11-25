import type { AvatarTone } from '@/theme';
import type { PlayingRole } from '@/types/profile';

export type SearchTab = 'all' | 'tournaments' | 'teams' | 'players';
export type SearchGroupId = Exclude<SearchTab, 'all'>;

export type SearchRow = {
  id: string;
  short: string;
  name: string;
  meta: string;
  badge?: string;
  role?: PlayingRole;
  tone: AvatarTone;
  shape: 'circle' | 'square';
  /** A real uploaded picture, shown instead of the initials. */
  imageUri?: string | null;
};

export type SearchGroup = { id: SearchGroupId; rows: SearchRow[] };

export const searchTabs: SearchTab[] = ['all', 'tournaments', 'teams', 'players'];
