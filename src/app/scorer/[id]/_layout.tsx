import { Stack, useLocalSearchParams } from 'expo-router';

import { ScorerProvider } from '@/features/scoring/scorer-provider';
import { useTheme } from '@/theme';

export default function ScorerLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  return <ScorerProvider key={id} matchId={id ?? 'm12'}>
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Screen name="shot" options={{ presentation: 'transparentModal', animation: 'fade', contentStyle: { backgroundColor: 'transparent' } }} />
    </Stack>
  </ScorerProvider>;
}
