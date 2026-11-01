import { TournamentMatchesScreen } from '@/features/tournament/tournament-matches-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentMatchesScreen, 'matches');
