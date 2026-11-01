import { TeamOverviewScreen } from '@/features/team/team-overview-screen';
import { withRealTeam } from '@/features/team/real/with-real-team';

export default withRealTeam(TeamOverviewScreen, 'overview');
