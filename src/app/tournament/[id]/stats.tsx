import { TournamentStatsScreen } from '@/features/tournament/tournament-stats-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentStatsScreen, 'stats');
