import { TeamSquadScreen } from '@/features/team/team-squad-screen';
import { withRealTeam } from '@/features/team/real/with-real-team';

export default withRealTeam(TeamSquadScreen, 'squad');
