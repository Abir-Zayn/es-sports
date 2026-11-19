import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';
import { createInnings } from '../engine/create-innings';
import { initialSetup } from '../sample-data';
import { WicketScreen } from '../wicket-screen';

const mockDispatch = jest.fn();
const mockScore = createInnings(initialSetup);
jest.mock('../scorer-provider', () => ({ useScorer: () => ({ score: mockScore, dispatch: mockDispatch, pendingShot: null }), localEventId: () => 'test' }));
jest.mock('../use-scorer-routes', () => ({ useScorerRoutes: () => ({ back: jest.fn(), replace: jest.fn() }) }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) }));

it('offers caught and bowled separately and lets the scorer select the catcher', async () => {
  const score = createInnings(initialSetup);
  await render(<ThemeProvider><WicketScreen /></ThemeProvider>);
  expect(screen.getByRole('button', { name: 'Caught' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Bowled' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Caught & bowled' })).toBeNull();
  await fireEvent.press(screen.getByRole('button', { name: 'Caught' }));
  expect(screen.getByText('Caught by')).toBeTruthy();
  const fielder = Object.values(score.bowlers)[0];
  await fireEvent.press(screen.getByRole('button', { name: fielder.name }));
  await fireEvent.press(screen.getByRole('button', { name: 'Confirm wicket' }));
  expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'delivery', input: expect.objectContaining({ dismissal: 'Caught', fielderId: fielder.id }) }));
});
