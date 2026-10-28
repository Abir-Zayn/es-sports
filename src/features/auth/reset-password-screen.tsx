import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button } from '@/components/ui';

import { AuthLayout } from './auth-layout';
import { RecoveredPasswordForm } from './recovered-password-form';
import { useRecoverySession } from './use-recovery-session';

export function ResetPasswordScreen() {
  const { '#': fragment } = useLocalSearchParams<{ '#': string }>();
  const { state, revision, retry } = useRecoverySession(fragment);

  useEffect(() => {
    // Drop credentials from navigation/browser history after verification.
    if (fragment && state.status !== 'checking') router.setParams({ '#': '' });
  }, [fragment, state.status]);

  if (state.status === 'ready') return <RecoveredPasswordForm key={revision} userId={state.userId} />;

  return (
    <AuthLayout scrollable title={state.status === 'checking' ? 'Checking your link.' : 'Check your reset link.'}
      subtitle={state.status === 'checking' ? 'Please wait while we verify your password reset link.' : state.message}>
      {state.status === 'checking' ? <Button label="Checking link" loading /> : (
        <>
          {state.retryable ? <Button label="Try again" onPress={retry} /> : null}
          <Button label="Request a new link" onPress={() => router.replace('/forgot-password')} />
        </>
      )}
    </AuthLayout>
  );
}
