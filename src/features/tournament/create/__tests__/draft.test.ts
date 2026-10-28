import { draftSchema, emptyDraft, formatDate, validateDraft } from '../draft';

const valid = { ...emptyDraft, name: 'City Cup', city: 'Chattogram', venue: 'Main Ground', startDate: '2030-11-03', endDate: '2030-11-05' };

describe('tournament form validation', () => {
  it('rejects whitespace and dates before today', () => {
    expect(validateDraft({ ...valid, name: '  ', startDate: '2030-11-01' }, '2030-11-02')).toEqual({
      name: expect.any(String), startDate: expect.any(String),
    });
  });
  it('rejects impossible dates and accepts a one-day tournament', () => {
    expect(validateDraft({ ...valid, startDate: '2030-02-30' }, '2030-02-01').startDate).toBeTruthy();
    expect(validateDraft({ ...valid, endDate: valid.startDate }, '2030-11-03')).toEqual({});
    expect(formatDate('not a date')).toBe('Choose a date');
  });
  it('requires an end date on or after the start', () => {
    expect(validateDraft({ ...valid, endDate: '' }, '2030-11-02').endDate).toBeTruthy();
    expect(validateDraft({ ...valid, endDate: '2030-11-02' }, '2030-11-02').endDate).toBe('End date must be on or after the start date.');
  });
  it('requires a complete knockout bracket and permits six teams in a league', () => {
    expect(validateDraft({ ...valid, competition: 'knockout', teams: 6 }, '2030-11-02').teams).toBeTruthy();
    expect(validateDraft({ ...valid, competition: 'league', teams: 6 }, '2030-11-02')).toEqual({});
  });
  it('restores older drafts with empty cover and end date fields', () => {
    const { coverUri, endDate, ...legacy } = emptyDraft;
    expect(draftSchema.parse(legacy)).toEqual({ ...legacy, coverUri, endDate });
  });
});
