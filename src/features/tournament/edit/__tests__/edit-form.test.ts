import { imagePathOf } from '../../data/tournament-images';
import { isEditChanged, validateEdit, type EditForm } from '../edit-form';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const original: EditForm = {
  overs: 20, startDate: '2026-11-10', endDate: '2026-11-20', registrationOpens: '', registrationDeadline: '2026-11-09', coverUri: '', profileUri: '',
};
const today = '2026-11-17';

describe('validateEdit', () => {
  it('lets a started tournament keep its past start date and extend its end', () => {
    expect(validateEdit({ ...original, endDate: '2026-11-25', overs: 12 }, original, today)).toEqual({});
  });
  it('refuses moving the start into the past', () => {
    expect(validateEdit({ ...original, startDate: '2026-11-12' }, original, today).startDate).toBeTruthy();
  });
  it('refuses an end before the start and a deadline after the start', () => {
    const errors = validateEdit({ ...original, startDate: '2026-11-30', endDate: '2026-11-29', registrationDeadline: '2026-12-01' }, original, today);
    expect(errors.endDate).toBeTruthy();
    expect(errors.registrationDeadline).toBeTruthy();
  });
  it('notices any changed field', () => {
    expect(isEditChanged(original, original)).toBe(false);
    expect(isEditChanged({ ...original, coverUri: 'file:///a.jpg' }, original)).toBe(true);
  });
});

describe('imagePathOf', () => {
  it('reads the storage path from a public avatars URL, ignoring the query', () => {
    expect(imagePathOf('https://x.supabase.co/storage/v1/object/public/avatars/u1/tournament/t1/cover-123?v=1')).toBe('u1/tournament/t1/cover-123');
  });
  it('ignores empty values and other buckets', () => {
    expect(imagePathOf(null)).toBeNull();
    expect(imagePathOf('https://x.supabase.co/storage/v1/object/public/other/u1/a')).toBeNull();
  });
});
