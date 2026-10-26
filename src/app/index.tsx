import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/auth-provider';

export default function Index() {
  const { session, isLoading } = useAuth();
  if (isLoading) return null;
  return <Redirect href={session ? '/home' : '/login'} />;
}
