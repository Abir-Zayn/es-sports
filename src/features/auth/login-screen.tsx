import { Link } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, PasswordField, Text, TextField } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { resendConfirmation } from './resend-confirmation';
import { signInSchema, signInWithEmail } from './sign-in';
import { SocialOptions } from './social-options';

type FieldErrors = { email?: string; password?: string };

export function LoginScreen() {
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
    if (result.ok) setNotice('Check your inbox. Confirm your email, then return here to log in.');
    else setFormError(result.message);
    setLoading(false);
    inFlight.current = false;
  }

  return (
    <AuthLayout scrollable title="Back on strike." subtitle="Log in to run your tournament.">
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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <PasswordField
          ref={passwordRef}
          placeholder="Add password"
          value={password}
          editable={!loading}
          onChangeText={setPassword}
          error={errors.password}
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        <Text variant="caption" style={styles.forgot}>
          <Link href="/forgot-password" style={styles.forgotAction}>
            Forgot password?
          </Link>
        </Text>
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        {notice ? <Text variant="caption" accessibilityLiveRegion="polite">{notice}</Text> : null}
        <Button label="Log in" onPress={submit} loading={loading} />
        {confirmationEmail ? <Button label="Resend confirmation email" variant="secondary" onPress={resend} disabled={loading} /> : null}
      </View>

      <SocialOptions />
      <AuthSwitchLink prompt="Don’t have an account?" action="Create one" href="/sign-up" />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
    forgot: { alignSelf: 'flex-end' },
    forgotAction: { color: colors.link, fontWeight: '700' },
  });
