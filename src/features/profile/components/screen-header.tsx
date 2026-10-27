import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useTheme } from '@/theme';

type Props = {
  title: string;
  /** Right-hand content, e.g. a Save button. */
  trailing?: ReactNode;
};

/** Back tile and a heading, like the Terms screen. */
export function ScreenHeader({ title, trailing }: Props) {
  const router = useRouter();
  const { colors } = useTheme();
  return (
    <View style={styles.header}>
      <AppIconTile
        icon={ChevronLeft}
        size={44}
        borderRadius={radius.md}
        backgroundColor={colors.surfaceRaised}
        accessibilityLabel="Go back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/profile'))}
      />
      <Text variant="heading" accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  title: { flex: 1 },
});
