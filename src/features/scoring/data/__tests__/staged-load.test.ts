import { initialSetup } from '../../sample-data';
import { loadScorer } from '../load-scorer';
import { buildMatchRows } from '../match-rows';
import { canScoreMatch, fetchEvents, fetchPlayers, findMatch } from '../match-repository';
import { clearStagedSetups, stageMatchSetup } from '../staged-setups';

jest.mock('../match-repository', () => ({
  isUuid: (value: string) => /^[0-9a-f]{8}-/.test(value),
  findMatch: jest.fn().mockResolvedValue(null),
  fetchPlayers: jest.fn(),
  fetchEvents: jest.fn(),
  canScoreMatch: jest.fn().mockResolvedValue(true),
  signedInUserId: jest.fn().mockResolvedValue('user-1'),
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

  it('opens a saved friendly from its match id before the first innings', async () => {
    const setup = { ...initialSetup, title: 'Friendly', preset: true };
    const rows = buildMatchRows(MATCH, 'friendly-1', setup, new Date());
    jest.mocked(findMatch).mockResolvedValueOnce({ ...rows.match, status: 'scheduled', started_at: null,
      tournament_id: null, created_by: 'user-1', completed_at: null, result_type: null });
    jest.mocked(fetchPlayers).mockResolvedValueOnce(rows.players);
    jest.mocked(fetchEvents).mockResolvedValueOnce([]);
    const loaded = await loadScorer(MATCH, 'user-2');
    expect(loaded.saved).toMatchObject({ matchExists: true, auditLength: 0 });
    expect(loaded.session.setup).toMatchObject({ title: 'Friendly', preset: true, playingXi: setup.playingXi });
    expect(loaded.session.score).toBeNull();
  });

  it('does not open a partially saved friendly with missing squads', async () => {
    const rows = buildMatchRows(MATCH, 'friendly-1', { ...initialSetup, preset: true }, new Date());
    jest.mocked(findMatch).mockResolvedValueOnce({ ...rows.match, status: 'scheduled', started_at: null,
      tournament_id: null, created_by: 'user-1', completed_at: null, result_type: null });
    jest.mocked(fetchPlayers).mockResolvedValueOnce([]);
    jest.mocked(fetchEvents).mockResolvedValueOnce([]);
    await expect(loadScorer(MATCH, 'user-1')).rejects.toThrow('This match setup is incomplete');
  });

  it('refuses to open a match when the database denies scoring permission', async () => {
    const rows = buildMatchRows(MATCH, 'friendly-1', { ...initialSetup, preset: true }, new Date());
    jest.mocked(findMatch).mockResolvedValueOnce({ ...rows.match, status: 'live',
      tournament_id: null, created_by: 'user-1', completed_at: null, result_type: null });
    jest.mocked(canScoreMatch).mockResolvedValueOnce(false);
    await expect(loadScorer(MATCH, 'user-1')).rejects.toThrow('Only the assigned scorer can score this match.');
  });
});
