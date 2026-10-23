// TODO: replace with a Supabase search once the project and tables exist. Sample values from the design file.
import type { AvatarTone } from '@/theme';

export type SearchTab = 'all' | 'tournaments' | 'teams' | 'players';
export type SearchGroupId = Exclude<SearchTab, 'all'>;

export type SearchRow = {
  id: string;
  short: string;
  name: string;
  meta: string;
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

export const recentSearches = ['HSF Premier League', 'Patenga Riders', 'Nayeem'];

const catalogue: SearchGroup[] = [
  {
    id: 'teams',
    title: 'Teams',
    rows: [
      { id: 'cs', short: 'CS', name: 'Chattogram Strikers', meta: 'HSF Premier League · 15 players', tone: 'blue', shape: 'circle' },
      { id: 'ss', short: 'SS', name: 'Sea Beach Strikers', meta: 'Friendly team · 12 players', tone: 'yellow', shape: 'circle' },
    ],
  },
  {
    id: 'players',
    title: 'Players',
    rows: [
      { id: 'rh', short: 'RH', name: 'Rafi Hasan', meta: 'Batter · Chattogram Strikers', tone: 'neutral', shape: 'circle' },
      { id: 'ni', short: 'NI', name: 'Nayeem Islam', meta: 'Bowler · Chattogram Strikers', tone: 'neutral', shape: 'circle' },
    ],
  },
  {
    id: 'tournaments',
    title: 'Tournaments',
    rows: [{ id: 'sc', short: 'SC', name: 'Strikers Cup', meta: 'Knockout · 6 teams · Completed', tone: 'blue', shape: 'square' }],
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
      rows: group.rows.filter((row) => `${row.name} ${row.meta}`.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.rows.length > 0);
}
