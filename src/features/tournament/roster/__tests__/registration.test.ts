import { roster } from '../__fixtures__/roster-fixture';
import { closeProblem, deadlineProblem, lockProblem, registrationLabel, registrationStatus, reopenProblem } from '../registration';
import { parseSetup, setupParams } from '../setup';
import { emptyDraft } from '../../create/draft';

const today = '2026-11-05';
const windowed = (over: Partial<ReturnType<typeof roster>['registration']> = {}) =>
  roster({ registration: { opensOn: '2026-11-01', deadline: '2026-11-10', closedEarly: false, ...over }, startsOn: '2026-11-12' });

describe('registration window', () => {
  it('is upcoming, open, then closed around its dates, and locked once the rosters lock', () => {
    expect(registrationStatus(windowed(), '2026-10-31')).toBe('upcoming');
    expect(registrationStatus(windowed(), today)).toBe('open');
    expect(registrationStatus(windowed(), '2026-11-10')).toBe('open');
    expect(registrationStatus(windowed(), '2026-11-11')).toBe('closed');
    expect(registrationStatus(windowed({ closedEarly: true }), today)).toBe('closed');
    expect(registrationStatus({ ...windowed(), locked: true }, today)).toBe('locked');
    expect(registrationStatus(roster(), '2099-01-01')).toBe('open');
  });

  it('describes the status in one line', () => {
    expect(registrationLabel(windowed(), today)).toBe('Open until 10 Nov 2026');
    expect(registrationLabel(roster(), today)).toBe('Open until rosters lock');
    expect(registrationLabel({ ...windowed(), locked: true }, today)).toBe('Rosters locked');
  });

  it('lets only the owner move the deadline, within the window and before the start', () => {
    expect(deadlineProblem(windowed(), 'moderator', '2026-11-11', today)).toMatch(/Only the tournament owner/);
    expect(deadlineProblem(windowed(), 'owner', '2026-11-11', today)).toBeNull();
    expect(deadlineProblem(windowed(), 'owner', '2026-11-06', today)).toBeNull();
    expect(deadlineProblem(windowed(), 'owner', '2026-11-04', today)).toMatch(/today or a later date/);
    expect(deadlineProblem(windowed(), 'owner', '2026-11-13', today)).toMatch(/by the start date/);
    expect(deadlineProblem({ ...windowed(), locked: true }, 'owner', '2026-11-11', today)).toMatch(/locked/);
  });

  it('closes an open window early and re-opens it while the deadline stands', () => {
    expect(closeProblem(windowed(), 'owner', today)).toBeNull();
    expect(closeProblem(windowed({ closedEarly: true }), 'owner', today)).toMatch(/not open/);
    expect(reopenProblem(windowed({ closedEarly: true }), 'owner', today)).toBeNull();
    expect(reopenProblem(windowed(), 'owner', today)).toMatch(/not closed early/);
    expect(reopenProblem(windowed({ closedEarly: true }), 'owner', '2026-11-11')).toMatch(/Set a new deadline/);
  });

  it('locks once, by the owner only', () => {
    expect(lockProblem(windowed(), 'owner')).toBeNull();
    expect(lockProblem(windowed(), 'moderator')).toMatch(/Only the tournament owner/);
    expect(lockProblem({ ...windowed(), locked: true }, 'owner')).toMatch(/already locked/);
  });
});

describe('setup handed from the tournament form', () => {
  it('carries sizes and dates, closing registration at the start when no deadline is set', () => {
    const draft = { ...emptyDraft, name: 'Gully Cup', teams: 12 as const, playersPerSide: 6, minSquad: 8, maxSquad: 10, startDate: '2026-12-01' };
    expect(parseSetup(setupParams(draft))).toEqual({
      tournamentName: 'Gully Cup',
      maxTeams: 12,
      squadRules: { playersPerSide: 6, minSquad: 8, maxSquad: 10 },
      registration: { opensOn: '', deadline: '2026-12-01' },
      startsOn: '2026-12-01',
    });
  });

  it('falls back to safe values for missing or tampered params', () => {
    const setup = parseSetup({ teams: '99', side: '30', opens: 'soon' });
    expect(setup.maxTeams).toBe(8);
    expect(setup.squadRules).toEqual({ playersPerSide: 11, minSquad: 14, maxSquad: 16 });
    expect(setup.registration).toEqual({ opensOn: '', deadline: '' });
    expect(setup.tournamentName).toBe('Untitled tournament');
  });
});
