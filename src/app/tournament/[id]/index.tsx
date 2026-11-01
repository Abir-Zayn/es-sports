import { TournamentOverviewScreen } from '@/features/tournament/tournament-overview-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentOverviewScreen, 'overview');
