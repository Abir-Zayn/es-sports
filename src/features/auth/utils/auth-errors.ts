type AuthError = { code?: string; message?: string };

export function authErrorMessage(error: AuthError, fallback: string): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Email or password is wrong.';
    case 'email_not_confirmed':
      return 'Confirm your email before logging in. Check your inbox or resend the email below.';
    case 'user_already_exists':
      return 'An account with this email already exists. Log in instead.';
    case 'weak_password':
      return 'That password is too easy to guess. Try another.';
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Wait a minute and try again.';
    case 'identity_already_exists':
      return 'That Google account is already linked to another esSports account.';
    case 'manual_linking_disabled':
      return 'Linking accounts isn’t available right now. Try again later.';
    case 'provider_disabled':
    case 'validation_failed':
      return 'Google sign-in isn’t available right now. Try again later.';
    case 'signup_disabled':
    case 'email_provider_disabled':
      return 'Email sign-up is unavailable right now. Try again later.';
    case 'email_address_invalid':
    case 'email_address_not_authorized':
      return 'We could not send a confirmation email to this address. Try another email address.';
    default:
      return fallback;
  }
}
