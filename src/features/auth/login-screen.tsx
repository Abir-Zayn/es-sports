import { useRouter } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, PasswordField, Text, TextField } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { AuthLayout } from './auth-layout';
import { AuthSwitchLink } from './auth-switch-link';
import { signInSchema, signInWithEmail } from './sign-in';
import { SocialOptions } from './social-options';

type FieldErrors = { email?: string; password?: string };

export function LoginScreen() {
  const router = useRouter();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    const parsed = signInSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      const flat = parsed.error.flatten().fieldErrors;
      setErrors({ email: flat.email?.[0], password: flat.password?.[0] });
      return;
    }
    setErrors({});
    setFormError(null);
    setLoading(true);
    const result = await signInWithEmail(parsed.data);
    setLoading(false);
    if (result.ok) router.replace('/home');
    else setFormError(result.message);
  }

  return (
    <AuthLayout title="Back on strike." subtitle="Log in to run your tournament.">
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
          returnKeyType="done"
          onSubmitEditing={submit}
        />
        {formError ? (
          <Text variant="caption" style={styles.formError} accessibilityLiveRegion="polite">
            {formError}
          </Text>
        ) : null}
        <Button label="Log in" onPress={submit} loading={loading} />
      </View>

      <SocialOptions />
      <AuthSwitchLink prompt="Don't have an account?" action="Create one!" href="/sign-up" />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  formError: { color: colors.danger },
});
