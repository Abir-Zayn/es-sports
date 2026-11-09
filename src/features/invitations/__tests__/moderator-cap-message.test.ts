import { toInvitationError } from '../invitation-errors';
import { tournamentErrorText } from '../../tournament/data/tournament-errors';

describe('moderator limit (ET008)', () => {
  it('explains the 3 moderator limit when sending an invitation', () => {
    expect(toInvitationError({ code: 'ET008' }).message).toMatch(/3 moderators/);
  });

  it('explains the 3 moderator limit for tournament calls', () => {
    expect(tournamentErrorText({ code: 'ET008' })).toMatch(/3 moderators/);
  });
});
