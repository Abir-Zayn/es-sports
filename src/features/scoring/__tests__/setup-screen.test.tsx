import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { playerName } from '@/features/scoring/setup-defaults';
import { initialSetup } from '@/features/scoring/__fixtures__/test-setup';
import { ScorerSetupScreen } from '../setup-screen';
import type { MatchSetup } from '../types';

let mockSetup: MatchSetup = initialSetup;
let mockFixtureRef = '';
const mockDispatch = jest.fn((action: { type: string; value?: MatchSetup }) => { if (action.type === 'setup' && action.value) mockSetup = action.value; });
const mockReplace = jest.fn();
jest.mock('../scorer-provider', () => ({
  useScorer: () => ({ setup: mockSetup, score: null, dispatch: mockDispatch, fixtureRef: mockFixtureRef }),
  localEventId: () => 'event',
}));
jest.mock('../use-scorer-routes', () => ({ useScorerRoutes: () => ({ replace: mockReplace, back: jest.fn(), leave: jest.fn(), toPad: jest.fn(), push: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

const kings = initialSetup.teams.KK.team.name;
const strikers = initialSetup.teams.CS.team.name;
const show = async () => render(<ThemeProvider><ScorerSetupScreen /></ThemeProvider>);

beforeEach(() => { mockSetup = initialSetup; mockFixtureRef = ''; mockDispatch.mockClear(); mockReplace.mockClear(); });

it('numbers the steps and shows the toss as a face-off, the sides as ready, and who opens above Start', async () => {
  await show();
  expect(screen.getByText('Toss')).toBeTruthy();
  expect(screen.getByText('Playing XI')).toBeTruthy();
  expect(screen.getByText('Openers & opening bowler')).toBeTruthy();
  expect(screen.getByText('Scoring options')).toBeTruthy();
  expect(screen.getByRole('radio', { name: `${kings} won the toss`, selected: true })).toBeTruthy();
  expect(screen.getByText(`${kings} will bat first`)).toBeTruthy();
  expect(screen.getAllByText('Ready')).toHaveLength(2);
  const opener = playerName(initialSetup, 'KK-0');
  expect(screen.getByText(`${opener} and ${playerName(initialSetup, 'KK-1')} open · ${playerName(initialSetup, 'CS-10')} bowls first`)).toBeTruthy();
});

it('changes the toss and the decision, which decides who bats first', async () => {
  const view = await show();
  await fireEvent.press(screen.getByRole('radio', { name: `${strikers} won the toss` }));
  expect(mockSetup.tossWinner).toBe('CS');
  await view.rerender(<ThemeProvider><ScorerSetupScreen /></ThemeProvider>);
  await fireEvent.press(screen.getByRole('radio', { name: 'Bowl first' }));
  expect(mockSetup.decision).toBe('bowl');
  await view.rerender(<ThemeProvider><ScorerSetupScreen /></ThemeProvider>);
  expect(screen.getByText(`${kings} will bat first`)).toBeTruthy();
});

it('swaps the striker and non-striker in one tap, and starts the match', async () => {
  await show();
  await fireEvent.press(screen.getByText('Swap striker and non-striker'));
  expect([mockSetup.strikerId, mockSetup.nonStrikerId]).toEqual(['KK-1', 'KK-0']);
  await fireEvent.press(screen.getByText('Start match'));
  expect(mockDispatch).toHaveBeenCalledWith({ type: 'start', id: 'event' });
  expect(mockReplace).toHaveBeenCalledWith('pad');
});

it('leaves out the playing XI step in a tournament, whose sides were picked at the start', async () => {
  mockFixtureRef = 'tournament-abc';
  await show();
  expect(screen.queryByText('Playing XI')).toBeNull();
  expect(screen.getByText('Openers & opening bowler')).toBeTruthy();
});
