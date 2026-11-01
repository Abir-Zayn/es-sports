import { HeadToHeadScreen } from '@/features/tournament/head-to-head-screen';
import { withRealTournament } from '@/features/tournament/real/with-real-tournament';

export default withRealTournament(HeadToHeadScreen, 'teams');
