import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

/** Placeholder for a screen that isn't built yet, with a way back. */
export function ComingSoonScreen({ title }: { title: string }) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
      </View>
      <View style={styles.body}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        <Text muted>Coming soon.</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: { paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  });
