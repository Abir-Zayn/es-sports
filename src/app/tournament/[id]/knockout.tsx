import { TournamentKnockoutScreen } from '@/features/tournament/knockout/tournament-knockout-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(TournamentKnockoutScreen, 'knockout');
