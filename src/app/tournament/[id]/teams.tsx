import { TournamentTeamsScreen } from '@/features/tournament/tournament-teams-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentTeamsScreen, 'teams');
