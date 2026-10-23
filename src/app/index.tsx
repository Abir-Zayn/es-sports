import { Redirect } from 'expo-router';

// TODO: send signed-in users to /home once the auth session is restored on launch.
export default function Index() {
  return <Redirect href="/login" />;
}
