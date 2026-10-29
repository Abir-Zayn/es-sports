import { draftSchema, emptyDraft, validateDraft } from '../draft';
import { describeRules, presetRules, squadRulesProblem } from '../squad-formats';

const valid = { ...emptyDraft, name: 'City Cup', city: 'Chattogram', venue: 'Main Ground', startDate: '2030-11-03', endDate: '2030-11-05' };
const today = '2030-11-01';

describe('side formats', () => {
  it('maps each preset to its side and squad sizes, and custom to none', () => {
    expect(presetRules('gully_6')).toEqual({ playersPerSide: 6, minSquad: 8, maxSquad: 10 });
    expect(presetRules('standard_11')).toEqual({ playersPerSide: 11, minSquad: 14, maxSquad: 16 });
    expect(presetRules('custom')).toBeNull();
    expect(describeRules({ playersPerSide: 8, minSquad: 10, maxSquad: 12 })).toBe('8 a side · squads of 10 to 12');
  });

  it('accepts sizes that fit together and explains those that do not', () => {
    expect(squadRulesProblem({ playersPerSide: 7, minSquad: 9, maxSquad: 11 })).toBeNull();
    expect(squadRulesProblem({ playersPerSide: 5, minSquad: 8, maxSquad: 10 })).toMatch(/6 to 11 players a side/);
    expect(squadRulesProblem({ playersPerSide: 8, minSquad: 7, maxSquad: 10 })).toMatch(/full side/);
    expect(squadRulesProblem({ playersPerSide: 8, minSquad: 10, maxSquad: 9 })).toMatch(/cannot be smaller/);
    expect(squadRulesProblem({ playersPerSide: 11, minSquad: 14, maxSquad: 17 })).toMatch(/limited to 16/);
  });
});

describe('tournament draft squad and registration fields', () => {
  it('flags a custom format whose sizes clash', () => {
    expect(validateDraft({ ...valid, sideFormat: 'custom', playersPerSide: 9, minSquad: 8 }, today).maxSquad).toMatch(/full side/);
  });

  it('keeps registration optional, but orders the dates when given', () => {
    expect(validateDraft(valid, today)).toEqual({});
    expect(validateDraft({ ...valid, registrationOpens: '2030-11-02', registrationDeadline: '2030-11-01' }, today).registrationDeadline).toMatch(/on or after/);
    expect(validateDraft({ ...valid, registrationDeadline: '2030-11-04' }, today).registrationDeadline).toMatch(/by the start date/);
    expect(validateDraft({ ...valid, registrationOpens: '2030-11-01', registrationDeadline: '2030-11-03' }, today)).toEqual({});
  });

  it('restores a draft saved before these fields existed as a full 11-a-side tournament', () => {
    const { sideFormat, playersPerSide, minSquad, maxSquad, registrationOpens, registrationDeadline, ...legacy } = valid;
    const restored = draftSchema.parse(legacy);
    expect(restored).toEqual({ ...legacy, sideFormat, playersPerSide, minSquad, maxSquad, registrationOpens, registrationDeadline });
    expect(restored.sideFormat).toBe('standard_11');
  });
});
