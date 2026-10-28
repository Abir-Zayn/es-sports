import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { InvitationCard } from './invitation-card';
import { answerInvitation, fetchInvitations } from './invitations-repository';

export const invitationsKey = ['invitations'] as const;

/** Invites to moderate a tournament or own a team, newest first, each answered here. */
export function InvitationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const queryClient = useQueryClient();
  const invitations = useQuery({ queryKey: invitationsKey, queryFn: fetchInvitations });
  const answer = useMutation({
    mutationFn: (a: { id: string; answer: 'accepted' | 'declined' }) => answerInvitation(a.id, a.answer),
    onSuccess: (list) => queryClient.setQueryData(invitationsKey, list),
  });
  const list = invitations.data ?? [];

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile
          icon={ChevronLeft}
          size={44}
          borderRadius={radius.pill}
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))}
        />
        <Text accessibilityRole="header" style={styles.title}>
          Invitations
        </Text>
      </View>
      {invitations.isPending ? (
        <ActivityIndicator color={colors.link} accessibilityLabel="Loading invitations" style={styles.status} />
      ) : invitations.isError ? (
        <View style={styles.failed}>
          <Text muted>Could not load your invitations.</Text>
          <Button label="Try again" variant="secondary" onPress={() => void invitations.refetch()} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
          {answer.isError ? (
            <Text accessibilityRole="alert" style={styles.error}>
              Could not send your answer. Please try again.
            </Text>
          ) : null}
          {list.length === 0 ? (
            <Text muted accessibilityLiveRegion="polite">
              No invitations right now.
            </Text>
          ) : (
            list.map((invitation, i) => (
              <View key={invitation.id} style={i > 0 ? styles.divided : undefined}>
                <InvitationCard
                  invitation={invitation}
                  busy={answer.isPending}
                  onAccept={() => answer.mutate({ id: invitation.id, answer: 'accepted' })}
                  onDecline={() => answer.mutate({ id: invitation.id, answer: 'declined' })}
                />
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    title: { flex: 1, fontSize: 18, lineHeight: 24, fontWeight: '700' },
    content: { paddingHorizontal: spacing.lg, maxWidth: 600, width: '100%', alignSelf: 'center' },
    status: { paddingVertical: spacing.xxl },
    failed: { alignItems: 'center', gap: spacing.md, padding: spacing.xl },
    error: { color: colors.dangerSoftText, paddingVertical: spacing.sm },
    divided: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  });
