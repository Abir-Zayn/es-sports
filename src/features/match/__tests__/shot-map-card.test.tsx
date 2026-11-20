import { fireEvent, render, screen } from '@testing-library/react-native';

import { ThemeProvider } from '@/theme';

import { ShotMapCard } from '../components/shot-map/shot-map-card';
import type { WagonBatter } from '../types';

const ck = { key: 'KK', name: 'Chittagong Kings', short: 'CK' };
const rl = { key: 'CS', name: 'Rajshahi Lions', short: 'RL' };
const batters: WagonBatter[] = [
  { id: 'KK:abir', name: 'Abir Chowdhury', line: '', score: '3*', team: ck, shots: [{ runs: 1, angle: -90 }, { runs: 2, angle: 180 }] },
  { id: 'KK:amin', name: 'Al Amin Hossain', line: '', score: '18*', team: ck, shots: [{ runs: 4, angle: 20 }, { runs: 6, angle: 100 }, { runs: 4, angle: 80 }] },
  { id: 'CS:x', name: 'Lion Opener', line: '', score: '4', team: rl, shots: [{ runs: 4, angle: 0 }] },
];

const show = () => render(<ThemeProvider><ShotMapCard batters={batters} /></ThemeProvider>);

describe('the viewer shot map', () => {
  it('opens on the first side with its key figures and filter counts', async () => {
    await show();
    expect(screen.getByLabelText('Shot map: 5 shots for Chittagong Kings')).toBeTruthy();
    expect(screen.getByLabelText('Shots: 5')).toBeTruthy();
    expect(screen.getByLabelText('Runs: 17')).toBeTruthy();
    expect(screen.getByRole('tab', { name: '4s · 2' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: '6s · 1' })).toBeTruthy();
    // Off is the right-hand half including straight (-90): 1 + 4 + 4 = 9 of 17 runs; 180 and 100 are leg.
    expect(screen.getByLabelText('Off side 9 runs, 53 percent. Leg side 8 runs, 47 percent')).toBeTruthy();
  });

  it('narrows to one batter, then switches side and starts again from the whole side', async () => {
    await show();
    await fireEvent.press(screen.getByRole('tab', { name: 'Al Amin Hossain 18*' }));
    expect(screen.getByLabelText('Shot map: 3 shots for Al Amin Hossain')).toBeTruthy();
    expect(screen.getByLabelText('Runs: 14')).toBeTruthy();
    await fireEvent.press(screen.getByRole('tab', { name: 'RL' }));
    expect(screen.getByLabelText('Shot map: 1 shots for Rajshahi Lions')).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'All RL' })).toBeTruthy();
  });

  it('has no team switch when the shots carry no side', async () => {
    await render(<ThemeProvider><ShotMapCard batters={batters.map(({ team: _team, ...b }) => b)} /></ThemeProvider>);
    expect(screen.queryByRole('tab', { name: 'RL' })).toBeNull();
    expect(screen.getByRole('tab', { name: 'All batters' })).toBeTruthy();
  });
});
