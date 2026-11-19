import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Button } from '@/components/ui';
import { useTranslation } from '@/i18n';

import { AuthLayout } from './auth-layout';
import { RecoveredPasswordForm } from './recovered-password-form';
import { useRecoverySession } from '../utils/use-recovery-session';

export function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { '#': fragment } = useLocalSearchParams<{ '#': string }>();
  const { state, revision, retry } = useRecoverySession(fragment);

  useEffect(() => {
    // Drop credentials from navigation/browser history after verification.
    if (fragment && state.status !== 'checking') router.setParams({ '#': '' });
  }, [fragment, state.status]);

  if (state.status === 'ready') return <RecoveredPasswordForm key={revision} userId={state.userId} />;

  return (
    <AuthLayout scrollable title={state.status === 'checking' ? t('auth.reset.checkingTitle') : t('auth.reset.invalidTitle')}
      subtitle={state.status === 'checking' ? t('auth.reset.checkingSubtitle') : state.message}>
      {state.status === 'checking' ? <Button label={t('auth.reset.checkingBtn')} loading /> : (
        <>
          {state.retryable ? <Button label={t('common.retry')} onPress={retry} /> : null}
          <Button label={t('auth.reset.requestNew')} onPress={() => router.replace('/forgot-password')} />
        </>
      )}
    </AuthLayout>
  );
}
