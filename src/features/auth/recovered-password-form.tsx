import { router } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, PasswordField, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { AuthLayout } from './auth-layout';
import { newPasswordSchema, saveRecoveredPassword } from './password-recovery';

export function RecoveredPasswordForm({ userId }: { userId: string }) {
  const styles = useThemedStyles(createStyles);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);
  const mounted = useRef(false);
  const inFlight = useRef(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function submit() {
    if (inFlight.current || invalid || saved) return;
    const parsed = newPasswordSchema.safeParse({ password, confirm });
    setFormError(null);
    if (!parsed.success) {
      const fields = parsed.error.flatten().fieldErrors;
      setErrors({ password: fields.password?.[0], confirm: fields.confirm?.[0] });
      return;
    }
    setErrors({}); inFlight.current = true; setLoading(true);
    try {
      const result = await saveRecoveredPassword(parsed.data, userId);
      if (!mounted.current) return;
      if (result.ok) { setPassword(''); setConfirm(''); setSaved(true); }
      else { setFormError(result.message); setInvalid(!result.retryable); }
    } finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }

  if (saved) return (
    <AuthLayout scrollable title="Password updated." subtitle="Your new password is saved. You are signed in and ready to continue.">
      <Button label="Continue" onPress={() => router.replace('/home')} />
    </AuthLayout>
  );

  if (invalid) return (
    <AuthLayout scrollable title="Request a new reset link." subtitle={formError ?? 'This reset session has expired.'}>
      <Button label="Request a new link" onPress={() => router.replace('/forgot-password')} />
    </AuthLayout>
  );

  return (
    <AuthLayout scrollable title="Choose a new password." subtitle="Use at least 8 characters for your new password.">
      <View style={styles.form}>
        <PasswordField label="New password" value={password} onChangeText={setPassword} error={errors.password}
          editable={!loading} autoComplete="new-password" textContentType="newPassword" returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()} />
        <PasswordField ref={confirmRef} label="Confirm new password" value={confirm} onChangeText={setConfirm}
          error={errors.confirm} editable={!loading} autoComplete="new-password" textContentType="newPassword"
          returnKeyType="done" onSubmitEditing={submit} />
        {formError ? <Text style={styles.error} accessibilityLiveRegion="polite">{formError}</Text> : null}
        <Button label="Save new password" loading={loading} onPress={submit} />
      </View>
    </AuthLayout>
  );
}

const createStyles = (colors: Palette) => StyleSheet.create({
  form: { gap: spacing.lg }, error: { color: colors.danger },
});
