import { useMutation, useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { claimGuestProfile, findClaim } from '../roster/squad-repository';
import { rosterErrorText, useMe } from '../roster/use-roster';

/** Opened from a squad invite link: shows the guest profile a team owner made, and lets this person claim it. */
export function ClaimScreen() {
  const router = useRouter();
  const { token = '' } = useLocalSearchParams<{ token?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const me = useMe();
  const claim = useQuery({ queryKey: ['squad-claim', token], queryFn: () => findClaim(token), enabled: Boolean(token) });
  const take = useMutation({ mutationFn: () => claimGuestProfile(token, me) });
  const found = take.data ?? claim.data;
  const goHome = () => router.replace('/home');

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={44} borderRadius={radius.pill} accessibilityLabel="Back" onPress={() => (router.canGoBack() ? router.back() : goHome())} />
        <Text accessibilityRole="header" style={styles.title}>
          Claim your profile
        </Text>
      </View>
      <View style={styles.body}>
        {claim.isPending && token ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Loading profile" />
        ) : claim.isError ? (
          <>
            <Text muted>Could not open this link. Check your connection and try again.</Text>
            <Button label="Try again" variant="secondary" onPress={() => void claim.refetch()} />
          </>
        ) : !found ? (
          <>
            <Text muted>This link is no longer valid. Ask your team owner to send a new one.</Text>
            <Button label="Go home" variant="secondary" onPress={goHome} />
          </>
        ) : (
          <>
            <Text style={styles.name}>{found.playerName}</Text>
            <Text muted>{`${found.role} for ${found.teamName} in ${found.tournamentName}`}</Text>
            {take.isSuccess ? (
              <Text accessibilityLiveRegion="polite" style={{ color: colors.link }}>
                Profile claimed. Matches for {found.teamName} now count on your career.
              </Text>
            ) : found.claimed ? (
              <Text muted>This profile has already been claimed.</Text>
            ) : (
              <Text muted>If this is you, claim it to keep its matches and stats on your own profile.</Text>
            )}
            {take.isError ? (
              <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
                {rosterErrorText(take.error)}
              </Text>
            ) : null}
            {found.claimed || take.isSuccess ? (
              <Button label="Go home" variant="secondary" onPress={goHome} />
            ) : (
              <Button label="This is me, claim it" loading={take.isPending} disabled={!me.id} onPress={() => take.mutate()} />
            )}
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '700' },
    body: { gap: spacing.md, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
    name: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  });
