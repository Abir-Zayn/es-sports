import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { resetRequestSchema, sendResetEmail } from './send-reset-email';

type FieldErrors = { email?: string };

export function ForgotPasswordScreen() {
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
      <AuthLayout scrollable title="Check your email." subtitle="If an account exists for this email, a reset link is on its way.">
        <Text accessibilityLiveRegion="polite">
          A password reset link was requested for {sentTo}. Check your inbox and spam folder. If nothing arrives, the address may
          not be registered.
        </Text>
        {formError ? <Text style={styles.formError} accessibilityLiveRegion="polite">{formError}</Text> : null}
        <Button label={remaining > 0 ? `Resend link in ${remaining}s` : 'Resend reset link'}
          disabled={remaining > 0} loading={loading} onPress={submit} />
        <Button label="Use another email" variant="secondary" disabled={loading} onPress={() => {
          setSentTo(null); setFormError(null);
        }} />
        <AuthSwitchLink prompt="Remembered your password?" action="Log in" href="/login" replace />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout scrollable title="Reset your password." subtitle="Enter your account email and we’ll send you a reset link.">
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
          editable={!loading}
          onChangeText={setEmail}
          error={errors.email}
          placeholder="you@example.com"
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
        <Button label={remaining > 0 ? `Send again in ${remaining}s` : 'Send reset link'}
          onPress={submit} loading={loading} disabled={remaining > 0} />
      </View>

      <AuthSwitchLink prompt="Remembered your password?" action="Log in" href="/login" replace />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
  });
