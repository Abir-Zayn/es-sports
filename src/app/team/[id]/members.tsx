import { TeamMembersScreen } from '@/features/team/team-members-screen';
import { withRealTeam } from '@/features/team/real/with-real-team';

export default withRealTeam(TeamMembersScreen, 'members');
