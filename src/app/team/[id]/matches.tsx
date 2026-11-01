import { TeamMatchesScreen } from '@/features/team/team-matches-screen';
import { withRealTeam } from '@/features/team/real/with-real-team';

export default withRealTeam(TeamMatchesScreen, 'matches');
