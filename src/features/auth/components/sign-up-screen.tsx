import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Checkbox, PasswordField, Text, TextField } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { resendConfirmation } from '../utils/resend-confirmation';
import { signUpSchema, signUpWithEmail } from '../utils/sign-up';

type FieldErrors = { email?: string; password?: string; confirm?: string; accepted?: string };

export function SignUpScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmSent, setConfirmSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [resent, setResent] = useState(false);

  async function submit() {
    if (inFlight.current) return;
    setFormError(null);
    const parsed = signUpSchema.safeParse({ email: email.trim(), password, confirm, accepted });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0], confirm: flat.confirm?.[0], accepted: flat.accepted?.[0] });
      return;
    }
    setErrors({});
    setFormError(null);
    setConfirmSent(false);
    inFlight.current = true;
    setLoading(true);
    const result = await signUpWithEmail(parsed.data);
    setLoading(false);
    inFlight.current = false;
    if (!result.ok) setFormError(result.message);
    else {
      setPassword('');
      setConfirm('');
      if (!result.signedIn) {
        setSubmittedEmail(parsed.data.email);
        setConfirmSent(true);
      }
    }
  }

  async function resend() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setFormError(null);
    setResent(false);
    const result = await resendConfirmation(submittedEmail);
    if (result.ok) setResent(true);
    else setFormError(result.message);
    setLoading(false);
    inFlight.current = false;
  }

  if (confirmSent) {
    return (
      <AuthLayout scrollable title={t('auth.signUp.confirmTitle')} subtitle={t('auth.signUp.confirmSubtitle')}>
        <Text accessibilityLiveRegion="polite">{t('auth.signUp.confirmBody', { email: submittedEmail })}</Text>
        {resent ? <Text style={styles.sent} accessibilityLiveRegion="polite">{t('auth.signUp.confirmResent')}</Text> : null}
        {formError ? <Text style={styles.formError} accessibilityLiveRegion="polite">{formError}</Text> : null}
        <Button label={t('auth.login.resend')} variant="secondary" loading={loading} onPress={resend} />
        <AuthSwitchLink prompt={t('auth.signUp.confirmedPrompt')} action={t('auth.signUp.logIn')} href="/login" replace />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout scrollable title={t('auth.signUp.title')} subtitle={t('auth.signUp.subtitle')}>
      <View style={styles.form}>
        <TextField
          label={t('auth.email')}
          value={email}
          editable={!loading}
          onChangeText={setEmail}
          error={errors.email}
          placeholder={t('auth.emailPlaceholder')}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          ref={passwordRef}
          placeholder={t('auth.passwordPlaceholder')}
          value={password}
          editable={!loading}
          onChangeText={setPassword}
          error={errors.password}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <PasswordField
          ref={confirmRef}
          label={t('auth.confirmPassword')}
          placeholder={t('auth.passwordPlaceholder')}
          value={confirm}
          editable={!loading}
          onChangeText={setConfirm}
          error={errors.confirm}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Checkbox
          checked={accepted}
          onChange={setAccepted}
          error={errors.accepted}
          accessibilityLabel={t('auth.signUp.agreeA11y')}
        >
          {t('auth.signUp.agreePrefix')}
          <Link href="/terms" style={styles.link}>
            {t('auth.signUp.terms')}
          </Link>
          {t('auth.signUp.agreeAnd')}
          <Link href="/privacy" style={styles.link}>
            {t('auth.signUp.privacy')}
          </Link>
          {t('auth.signUp.agreeSuffix')}
        </Checkbox>
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <Button label={t('auth.signUp.submit')} onPress={submit} loading={loading} />
      </View>

      <AuthSwitchLink prompt={t('auth.signUp.hasAccount')} action={t('auth.signUp.logIn')} href="/login" replace />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
    sent: { color: colors.link },
    link: { color: colors.link },
  });
