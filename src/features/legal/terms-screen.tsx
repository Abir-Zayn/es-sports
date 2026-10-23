import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { termsSections } from './terms-content';

export function TermsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <AppIconTile
          icon={ChevronLeft}
          size={44}
          borderRadius={radius.md}
          backgroundColor={colors.surfaceRaised}
          accessibilityLabel="Go back"
          onPress={() => router.back()}
        />
        <Text variant="heading" accessibilityRole="header">
          Terms and Conditions
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {termsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text variant="heading">{section.title}</Text>
            <Text muted>{section.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl },
    section: { gap: spacing.sm },
  });
