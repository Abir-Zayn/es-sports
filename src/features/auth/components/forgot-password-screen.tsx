import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { resetRequestSchema, sendResetEmail } from '../utils/send-reset-email';

type FieldErrors = { email?: string };

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inFlight = useRef(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const mounted = useRef(false);
  const [resendAt, setResendAt] = useState(0);
  const [remaining, setRemaining] = useState(0);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    const tick = () => setRemaining(Math.max(0, Math.ceil((resendAt - Date.now()) / 1000)));
    tick();
    if (resendAt <= Date.now()) return;
    const timer = setInterval(() => {
      tick();
      if (Date.now() >= resendAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendAt]);

  async function submit() {
    if (inFlight.current || Date.now() < resendAt) return;
    setFormError(null);
    const parsed = resetRequestSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrors({ email: parsed.error.flatten().fieldErrors.email?.[0] });
      return;
    }
    setErrors({});
    inFlight.current = true;
    setLoading(true);
    try {
      const result = await sendResetEmail(parsed.data.email);
      if (!mounted.current) return;
      // The confirmation is identical whether or not the account exists.
      if (result.ok) { setSentTo(parsed.data.email); setResendAt(Date.now() + 60_000); }
      else setFormError(result.message);
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  if (sentTo) {
    return (
      <AuthLayout scrollable title={t('auth.forgot.sentTitle')} subtitle={t('auth.forgot.sentSubtitle')}>
        <Text accessibilityLiveRegion="polite">
          {t('auth.forgot.sentBody', { email: sentTo })}
        </Text>
        {formError ? <Text style={styles.formError} accessibilityLiveRegion="polite">{formError}</Text> : null}
        <Button label={remaining > 0 ? t('auth.forgot.resendIn', { seconds: remaining }) : t('auth.forgot.resend')}
          disabled={remaining > 0} loading={loading} onPress={submit} />
        <Button label={t('auth.forgot.anotherEmail')} variant="secondary" disabled={loading} onPress={() => {
          setSentTo(null); setFormError(null);
        }} />
        <AuthSwitchLink prompt={t('auth.forgot.remembered')} action={t('auth.signUp.logIn')} href="/login" replace />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout scrollable title={t('auth.forgot.title')} subtitle={t('auth.forgot.subtitle')}>
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
          returnKeyType="send"
          onSubmitEditing={submit}
        />
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <Button label={remaining > 0 ? t('auth.forgot.sendAgainIn', { seconds: remaining }) : t('auth.forgot.send')}
          onPress={submit} loading={loading} disabled={remaining > 0} />
      </View>

      <AuthSwitchLink prompt={t('auth.forgot.remembered')} action={t('auth.signUp.logIn')} href="/login" replace />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
  });
