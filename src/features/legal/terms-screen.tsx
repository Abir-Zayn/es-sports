import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Text } from '@/components/ui';
import { colors, sizes, spacing } from '@/theme';

import { termsSections } from './terms-content';

export function TermsScreen() {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={sizes.hitSlop}
          onPress={() => router.back()}
          style={styles.back}
        >
          <ChevronLeft size={sizes.icon + 4} color={colors.text} />
        </Pressable>
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

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl },
  section: { gap: spacing.sm },
});
