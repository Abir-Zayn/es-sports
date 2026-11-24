import { TeamsScreen } from '@/features/team/directory/teams-screen';

/** "Manage your teams" from Profile and Home: the Teams screen, opened on the teams you are in. */
export default function MyTeamsRoute() {
  return <TeamsScreen initialScope="mine" />;
}
