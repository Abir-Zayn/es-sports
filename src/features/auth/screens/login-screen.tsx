import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, PasswordField, Text, TextField } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from '../components/auth-layout';
import { AuthSwitchLink } from '../components/auth-switch-link';
import { resendConfirmation } from '../server/resend-confirmation';
import { signInSchema, signInWithEmail } from '../server/sign-in';
import { SocialOptions } from '../components/social-options';

type FieldErrors = { email?: string; password?: string };

export function LoginScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    if (inFlight.current) return;
    setFormError(null);
    setNotice(null);
    setConfirmationEmail(null);
    const parsed = signInSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    inFlight.current = true;
    setLoading(true);
    const result = await signInWithEmail(parsed.data);
    setLoading(false);
    inFlight.current = false;
    // The session guard navigates only after Supabase emits SIGNED_IN.
    if (!result.ok) {
      setFormError(result.message);
      if (result.needsConfirmation) setConfirmationEmail(parsed.data.email);
    }
  }

  async function resend() {
    if (inFlight.current || !confirmationEmail) return;
    inFlight.current = true;
    setLoading(true);
    setNotice(null);
    const result = await resendConfirmation(confirmationEmail);
    if (result.ok) setNotice(t('auth.login.resentNotice'));
    else setFormError(result.message);
    setLoading(false);
    inFlight.current = false;
  }

  return (
    <AuthLayout scrollable title={t('auth.login.title')} subtitle={t('auth.login.subtitle')}>
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
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Text variant="caption" style={styles.forgot}>
          <Link href="/forgot-password" style={styles.forgotAction}>
            {t('auth.login.forgot')}
          </Link>
        </Text>
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        {notice ? <Text variant="caption" accessibilityLiveRegion="polite">{notice}</Text> : null}
        <Button label={t('auth.login.submit')} onPress={submit} loading={loading} />
        {confirmationEmail ? <Button label={t('auth.login.resend')} variant="secondary" onPress={resend} disabled={loading} /> : null}
      </View>

      <SocialOptions />
      <AuthSwitchLink prompt={t('auth.login.noAccount')} action={t('auth.login.createOne')} href="/sign-up" />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
    forgot: { alignSelf: 'flex-end' },
    forgotAction: { color: colors.link },
  });
