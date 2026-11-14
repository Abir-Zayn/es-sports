import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { expiryText, isOpen } from '../handover-rules';
import { useIncomingOffers, useNow } from '../use-handover';

/**
 * Offers from a scorer waiting for this account, on the Matches tab. The list is read again every time the tab
 * comes into focus. A failed read shows nothing: the offer is still there the next time the tab opens.
 */
export function IncomingHandoverBanner() {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const userId = useAuth().session?.user.id;
  const { data, refetch } = useIncomingOffers(userId);
  const now = useNow(true);
  useFocusEffect(useCallback(() => { if (userId) void refetch(); }, [refetch, userId]));
  const offers = (data ?? []).filter((offer) => isOpen(offer, now));
  if (offers.length === 0) return null;
  return <View style={styles.list}>
    {offers.map((offer) => <View key={offer.id} style={styles.card} accessibilityRole="alert">
      <Text style={styles.title}>{`${offer.fromName} asks you to score`}</Text>
      <Text muted style={styles.detail}>{`${offer.teamA} vs ${offer.teamB} · ${expiryText(offer, now)}`}</Text>
      <Button label="View request" size="compact" onPress={() => router.push({ pathname: '/handover/[id]', params: { id: offer.id } })} />
    </View>)}
  </View>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  list: { gap: spacing.sm },
  card: { gap: spacing.sm, padding: sizes.cardPadding, borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
  title: typography.headlineMd,
  detail: typography.bodyMd,
});
