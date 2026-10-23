import { Link, useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Checkbox, PasswordField, Text, TextField } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { signUpSchema, signUpWithEmail } from './sign-up';

type FieldErrors = { email?: string; password?: string; confirm?: string; accepted?: string };

export function SignUpScreen() {
  const router = useRouter();
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

  async function submit() {
    const parsed = signUpSchema.safeParse({ email: email.trim(), password, confirm, accepted });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0], confirm: flat.confirm?.[0], accepted: flat.accepted?.[0] });
      return;
    }
    setErrors({});
    setFormError(null);
    setConfirmSent(false);
    setLoading(true);
    const result = await signUpWithEmail(parsed.data);
    setLoading(false);
    if (!result.ok) setFormError(result.message);
    else if (result.signedIn) router.replace('/home');
    else setConfirmSent(true);
  }

  return (
    <AuthLayout scrollable title="Join the squad." subtitle="Create an account to run or follow tournaments.">
      <View style={styles.form}>
        <TextField
          label="Email"
          value={email}
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
          value={password}
          onChangeText={setPassword}
          error={errors.password}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <PasswordField
          ref={confirmRef}
          label="Confirm password"
          value={confirm}
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
          accessibilityLabel="I agree to the Terms and Conditions"
        >
          I agree to the{' '}
          <Link href="/terms" style={styles.link}>
            Terms and Conditions
          </Link>
        </Checkbox>
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        {confirmSent ? (
          <Text variant="caption" style={styles.sent} accessibilityLiveRegion="polite">
            Check your email to confirm your account, then log in.
          </Text>
        ) : null}
        <Button label="Create account" onPress={submit} loading={loading} />
      </View>

      <AuthSwitchLink prompt="Already have an account?" action="Log in" href="/login" replace />
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    form: { gap: spacing.lg },
    formError: { color: colors.danger },
    sent: { color: colors.link },
    link: { color: colors.link, fontWeight: '600' },
  });
