import { formatDate, registrationErrors, type DraftErrors, type TournamentDraft } from '../create/draft';
import type { TournamentRecord } from '../data/tournament-repository';

/** The fields the owner can change after publishing. Image values are a URL, a picked local file, or '' for none. */
export type EditForm = Pick<TournamentDraft, 'overs' | 'startDate' | 'endDate' | 'registrationOpens' | 'registrationDeadline' | 'coverUri' | 'profileUri'>;

export function editFormOf(t: TournamentRecord): EditForm {
  return {
    overs: t.overs, startDate: t.startDate, endDate: t.endDate,
    registrationOpens: t.registrationOpens, registrationDeadline: t.registrationDeadline,
    coverUri: t.coverUrl ?? '', profileUri: t.profileUrl ?? '',
  };
}

export const isEditChanged = (form: EditForm, original: EditForm) =>
  (Object.keys(form) as (keyof EditForm)[]).some((key) => form[key] !== original[key]);

/** The create form's rules, except that a start date already in the past may stay as it is. */
export function validateEdit(form: EditForm, original: EditForm, today: string): DraftErrors {
  const errors: DraftErrors = {};
  if (formatDate(form.startDate) === 'Choose a date') errors.startDate = 'Choose a start date.';
  else if (form.startDate !== original.startDate && form.startDate < today) errors.startDate = 'Choose today or a future start date.';
  if (formatDate(form.endDate) === 'Choose a date') errors.endDate = 'Choose an end date.';
  else if (form.endDate < form.startDate) errors.endDate = 'End date must be on or after the start date.';
  return { ...errors, ...registrationErrors(form) };
}
