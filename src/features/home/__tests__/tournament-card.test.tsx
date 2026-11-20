import { render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { TournamentCard, type Tournament } from '../components/tournament-card';

const base: Tournament = { id: 't1', short: 'BPL', name: 'Bangladesh Premiere League', meta: '6 teams', tone: 'blue' };
const show = async (tournament: Tournament) => {
  const { toJSON } = await render(<ThemeProvider><TournamentCard tournament={tournament} /></ThemeProvider>);
  return JSON.stringify(toJSON());
};

describe('tournament card', () => {
  it('fills the banner with the cover image and shows the profile image as the badge', async () => {
    const tree = await show({ ...base, coverUri: 'https://x/c.jpg', avatarUri: 'https://x/p.jpg' });
    expect(tree).toContain('https://x/c.jpg');
    expect(tree).toContain('https://x/p.jpg');
  });

  it('keeps the brand artwork and initials when neither image was uploaded', async () => {
    const tree = await show(base);
    expect(tree).not.toContain('https://x/');
    expect(screen.getByText('BPL', { includeHiddenElements: true })).toBeTruthy();
  });
});
