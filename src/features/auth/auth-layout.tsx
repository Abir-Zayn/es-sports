import type { ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '@/components/brand/brand-mark';
import { Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Off by default: a screen that fits one page stays fixed. Turn on for longer forms. */
  scrollable?: boolean;
};

/** Shared frame for the login and sign-up screens: mark, heading, keyboard-aware body. */
export function AuthLayout({ title, subtitle, children, scrollable = false }: Props) {
  const styles = useThemedStyles(createStyles);
  const body = (
    <>
      <View style={styles.logo}>
        <BrandMark size={100} />
      </View>
      <View style={styles.heading}>
        <Text variant="title" style={styles.title} accessibilityRole="header">
          {title}
        </Text>
        <Text muted>{subtitle}</Text>
      </View>
      {children}
    </>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {scrollable ? (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {body}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flex]}>{body}</View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, paddingBottom: spacing.lg, gap: spacing.xl },
    logo: { paddingTop: spacing.xxl },
    heading: { gap: spacing.sm },
    title: { fontWeight: '800' },
  });
