import { TournamentTableScreen } from '@/features/tournament/tournament-table-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentTableScreen, 'table');
