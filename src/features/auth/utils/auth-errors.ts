import { t } from '@/i18n';

type AuthError = { code?: string; message?: string };

export function authErrorMessage(error: AuthError, fallback: string): string {
  switch (error.code) {
    case 'invalid_credentials':
      return t('auth.err.invalidCredentials');
    case 'email_not_confirmed':
      return t('auth.err.emailNotConfirmed');
    case 'user_already_exists':
      return t('auth.err.userExists');
    case 'weak_password':
      return t('auth.err.weakPassword');
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return t('auth.err.rateLimit');
    case 'identity_already_exists':
      return t('auth.err.identityExists');
    case 'manual_linking_disabled':
      return t('auth.err.manualLinkingDisabled');
    case 'provider_disabled':
    case 'validation_failed':
      return t('auth.err.googleUnavailable');
    case 'signup_disabled':
    case 'email_provider_disabled':
      return t('auth.err.signupDisabled');
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return t('auth.err.emailNotAuthorized');
    default:
      return fallback;
  }
}
