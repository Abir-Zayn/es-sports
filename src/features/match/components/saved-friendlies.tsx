import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Play from 'lucide-react-native/icons/play';
import Trash from 'lucide-react-native/icons/trash';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { supabase } from '@/lib/supabase';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { DeleteFriendlyError, deleteFriendlyMatch } from '../friendly/delete-friendly';
import { DeleteMatchSheet } from './delete-match-sheet';

type ResumeMatch = { id: string; team_a_name: string; team_b_name: string; created_at: string; created_by?: string | null };
type Assignment = { match_id: string; user_id: string };

export const savedFriendliesKey = (userId: string) => ['saved-friendly-setups', userId] as const;

export function resumableFriendlies(owned: ResumeMatch[], assigned: ResumeMatch[], assignments: Assignment[], userId: string): ResumeMatch[] {
  const eligible = owned.filter((match) => !assignments.some((row) => row.match_id === match.id && row.user_id !== userId));
  return [...new Map([...eligible, ...assigned].map((match) => [match.id, match])).values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
}

/** Only the person who created a match may delete it; a scorer assigned to it may not. */
export const canDeleteSaved = (match: ResumeMatch, userId: string): boolean => match.created_by === userId;

const COLUMNS = 'id, team_a_name, team_b_name, created_at, created_by';

/** Scheduled and live friendlies this account is allowed to score can be reopened, or deleted by their creator. */
export function SavedFriendlies({ userId }: { userId: string }) {
  const router = useRouter();
  const client = useQueryClient();
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const [target, setTarget] = useState<ResumeMatch | null>(null);
  const matches = useQuery({
    queryKey: savedFriendliesKey(userId),
    enabled: Boolean(userId),
    staleTime: 0,
    queryFn: async ({ signal }) => {
      const assignments = await supabase.from('match_scorers').select('match_id, user_id').abortSignal(signal);
      if (assignments.error) throw assignments.error;
      const owned = await supabase.from('matches').select(COLUMNS)
        .eq('created_by', userId).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal);
      if (owned.error) throw owned.error;
      const assignedIds = (assignments.data ?? []).filter((row) => row.user_id === userId).map((row) => row.match_id);
      const assigned = assignedIds.length ? await supabase.from('matches').select(COLUMNS)
        .in('id', assignedIds).in('status', ['scheduled', 'live']).like('fixture_ref', 'friendly-%')
        .order('created_at', { ascending: false }).limit(20).abortSignal(signal) : { data: [], error: null };
      if (assigned.error) throw assigned.error;
      return resumableFriendlies(owned.data ?? [], assigned.data ?? [], assignments.data ?? [], userId);
    },
  });
  const removal = useMutation({
    mutationFn: (match: ResumeMatch) => deleteFriendlyMatch(match.id, userId),
    onSuccess: () => {
      setTarget(null);
      void client.invalidateQueries({ queryKey: savedFriendliesKey(userId) });
    },
  });
  function close() {
    if (removal.isPending) return;
    setTarget(null);
    removal.reset();
  }
  if (matches.isError) return <View style={s.group}>
    <Text muted>{t('friendly.saved.loadError')}</Text>
    <Button label={t('friendly.saved.retry')} variant="secondary" onPress={() => void matches.refetch()} />
  </View>;
  if (!matches.data?.length) return null;
  return <View style={s.group}>
    <Text accessibilityRole="header" muted style={s.label}>{t('friendly.saved.heading')}</Text>
    {matches.data.map((match) => {
      const label = t('match.vsTitle', { teamA: match.team_a_name, teamB: match.team_b_name });
      return <View key={match.id} style={s.row}>
        <Pressable accessibilityRole="button" accessibilityLabel={t('friendly.saved.resumeA11y', { label })}
          onPress={() => router.push({ pathname: '/scorer/[id]', params: { id: match.id } })}
          style={({ pressed }) => [s.open, pressed && s.pressed]}>
          <View style={s.play}><Play size={sizes.iconSmall} color={colors.link} fill={colors.link} /></View>
          <View style={s.text}>
            <Text style={s.title} numberOfLines={1}>{label}</Text>
            <Text muted style={s.caption}>{t('friendly.saved.resumeCaption')}</Text>
          </View>
        </Pressable>
        {canDeleteSaved(match, userId) ? <AppIconTile icon={Trash} size={sizes.iconButton} borderRadius={radius.pill}
          iconColor={colors.danger}
          accessibilityLabel={t('friendly.saved.deleteA11y', { label })} onPress={() => setTarget(match)} /> : null}
      </View>;
    })}
    <DeleteMatchSheet visible={target !== null} label={target ? t('match.vsTitle', { teamA: target.team_a_name, teamB: target.team_b_name }) : ''}
      busy={removal.isPending}
      error={removal.error ? (removal.error instanceof DeleteFriendlyError ? removal.error.message : t('friendly.saved.deleteError')) : null}
      onConfirm={() => target && removal.mutate(target)} onClose={close} />
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  group: { gap: spacing.sm },
  label: typography.labelUppercase,
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingRight: spacing.md,
    borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card,
  },
  open: { flex: 1, minHeight: dp(64), flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
  pressed: { transform: [{ scale: 0.98 }] },
  play: { width: sizes.iconButton, height: sizes.iconButton, alignItems: 'center', justifyContent: 'center', borderRadius: radius.pill, backgroundColor: c.primarySoft },
  text: { flex: 1, minWidth: 0, gap: dp(2) },
  title: typography.headlineMd,
  caption: typography.bodySm,
});
