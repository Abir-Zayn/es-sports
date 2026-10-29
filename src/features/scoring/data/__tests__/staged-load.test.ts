import { initialSetup } from '../../sample-data';
import { loadScorer } from '../load-scorer';
import { clearStagedSetups, stageMatchSetup } from '../staged-setups';

jest.mock('../match-repository', () => ({
  isUuid: (value: string) => /^[0-9a-f]{8}-/.test(value),
  findMatch: jest.fn().mockResolvedValue(null),
  fetchPlayers: jest.fn(),
  fetchEvents: jest.fn(),
}));

const MATCH = '55555555-5555-4555-8555-555555555555';

describe('opening a staged friendly', () => {
  beforeEach(clearStagedSetups);

  it('starts the scorer with the friendly setup, under the id its links were made with', async () => {
    const setup = { ...initialSetup, title: 'Friendly · A vs B', preset: true };
    stageMatchSetup('friendly-1', MATCH, setup);
    const loaded = await loadScorer('friendly-1', 'user-1');
    expect(loaded.matchId).toBe(MATCH);
    expect(loaded.session.setup).toBe(setup);
    expect(loaded.saved.matchExists).toBe(false);
  });

  it('refuses a friendly that was never set up on this phone, instead of opening the preview teams', async () => {
    await expect(loadScorer('friendly-unknown', 'user-1')).rejects.toThrow('This friendly match was not started. Set it up again.');
  });

  it('still opens a fixture reference with the preview setup', async () => {
    const loaded = await loadScorer('m12', 'user-1');
    expect(loaded.session.setup).toBe(initialSetup);
  });
});
