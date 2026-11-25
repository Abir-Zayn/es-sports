export const tournamentSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'matches', label: 'Matches' },
  { id: 'table', label: 'Table' },
  { id: 'knockout', label: 'Knockout' },
  { id: 'stats', label: 'Stats' },
  { id: 'teams', label: 'Groups' },
] as const;

export type TournamentSectionId = (typeof tournamentSections)[number]['id'];
