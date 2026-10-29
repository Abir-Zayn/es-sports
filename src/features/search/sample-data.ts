// TODO: replace with a Supabase search once the project and tables exist. Sample values from the design file.
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
};

export type SearchGroup = { id: SearchGroupId; title: string; rows: SearchRow[] };

export const searchTabs: { id: SearchTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'tournaments', label: 'Tournaments' },
  { id: 'teams', label: 'Teams' },
  { id: 'players', label: 'Players' },
];

const catalogue: SearchGroup[] = [
  {
    id: 'teams',
    title: 'Teams',
    rows: [
      { id: 'CS', short: 'CS', name: 'Chattogram Strikers', meta: 'HSF Premier League · 15 players', badge: 'Team', tone: 'blue', shape: 'circle' },
      { id: 'SS', short: 'SS', name: 'Sea Beach Strikers', meta: 'Friendly team · 12 players', badge: 'Team', tone: 'yellow', shape: 'circle' },
      { id: 'HSS', short: 'HSS', name: 'Halishahar Strikers', meta: 'Halishahar, Chattogram', badge: 'Team', tone: 'blue', shape: 'circle' },
      { id: 'AGT', short: 'AGT', name: 'Agrabad Tigers', meta: 'Agrabad, Chattogram', badge: 'Team', tone: 'yellow', shape: 'circle' },
      { id: 'PTS', short: 'PTS', name: 'Pahartali Smashers', meta: 'Pahartali, Chattogram', badge: 'Team', tone: 'neutral', shape: 'circle' },
      { id: 'CBK', short: 'CBK', name: 'Chawkbazar Kings', meta: 'Chawkbazar, Chattogram', badge: 'Team', tone: 'blue', shape: 'circle' },
    ],
  },
  {
    id: 'players',
    title: 'Players',
    rows: [
      { id: 'Rafi Hasan', short: 'RH', name: 'Rafi Hasan', meta: 'Chattogram Strikers', badge: 'Batter', role: 'batter', tone: 'neutral', shape: 'circle' },
      { id: 'Nayeem Islam', short: 'NI', name: 'Nayeem Islam', meta: 'Chattogram Strikers', badge: 'Bowler', role: 'bowler', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000001', short: 'TA', name: 'Tanvir Ahmed', meta: 'Halishahar, Chattogram', badge: 'All-rounder', role: 'all-rounder', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000002', short: 'LR', name: 'Liton Roy', meta: 'Agrabad, Chattogram', badge: 'Batter', role: 'batter', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000003', short: 'RI', name: 'Rashedul Islam', meta: 'Pahartali, Chattogram', badge: 'Bowler', role: 'bowler', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000004', short: 'AH', name: 'Arif Hossain', meta: 'Chawkbazar, Chattogram', badge: 'Keeper', role: 'keeper', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000005', short: 'SC', name: 'Shakib Chowdhury', meta: 'GEC, Chattogram', badge: 'All-rounder', role: 'all-rounder', tone: 'neutral', shape: 'circle' },
      { id: '11111111-1111-4111-8111-000000000006', short: 'MH', name: 'Mahmudul Hasan', meta: 'Nasirabad, Chattogram', badge: 'Batter', role: 'batter', tone: 'neutral', shape: 'circle' },
    ],
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    rows: [
      { id: 'hpl-2026', short: 'HPL', name: 'Halishahar Premier League 2026', meta: 'Halishahar, Chattogram', badge: 'Tournament', tone: 'blue', shape: 'square' },
      { id: 'strikers-cup-2026', short: 'SC', name: 'Strikers Cup 2026', meta: 'Chattogram', badge: 'Tournament', tone: 'blue', shape: 'square' },
    ],
  },
];

/** Groups with at least one row matching `query` in its name or details, limited to the chosen tab. */
export function searchAll(query: string, tab: SearchTab): SearchGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return catalogue
    .filter((group) => tab === 'all' || group.id === tab)
    .map((group) => ({
      ...group,
      rows: group.rows.filter((row) => `${row.name} ${row.short} ${row.meta} ${row.badge ?? ''}`.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.rows.length > 0);
}
