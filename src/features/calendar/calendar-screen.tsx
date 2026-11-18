import { useQuery } from '@tanstack/react-query';
import { addMonths, format, startOfMonth } from 'date-fns';
import { useRouter } from 'expo-router';
import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { fetchMyTeams, myTeamsKey } from '@/features/team';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { calendarKey, fetchCalendarFixtures, type CalendarFixture } from './calendar-repository';
import { DayFixtures } from './components/day-fixtures';
import { MonthGrid } from './components/month-grid';

/** The player's games by day: a month at a time, for every team they belong to. */
export function CalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const userId = useAuth().session?.user.id ?? '';
  const today = format(new Date(), 'yyyy-MM-dd');
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [selected, setSelected] = useState(today);
  const monthKey = format(month, 'yyyy-MM');

  const teams = useQuery({ queryKey: myTeamsKey(userId), queryFn: () => fetchMyTeams(userId), enabled: Boolean(userId) });
  const teamIds = useMemo(() => (teams.data ?? []).map((t) => t.id).sort(), [teams.data]);
  const fixtures = useQuery({
    queryKey: calendarKey(teamIds, monthKey), queryFn: () => fetchCalendarFixtures(teamIds, monthKey), enabled: teamIds.length > 0,
  });
  const gameDays = useMemo(() => new Set((fixtures.data ?? []).filter((f) => !f.cancelled).map((f) => f.date)), [fixtures.data]);
  const dayList = (fixtures.data ?? []).filter((f) => f.date === selected);

  function moveMonth(by: number) {
    const next = addMonths(month, by);
    setMonth(next);
    // Keep today chosen when coming back to this month; otherwise start on the 1st.
    setSelected(format(next, 'yyyy-MM') === today.slice(0, 7) ? today : format(next, 'yyyy-MM-dd'));
  }
  function open(fixture: CalendarFixture) {
    if (fixture.matchId) router.push({ pathname: '/match/[id]', params: { id: fixture.matchId } });
    else router.push({ pathname: '/tournament/[id]', params: { id: fixture.tournamentId } });
  }

  const pending = teams.isPending || (teamIds.length > 0 && fixtures.isPending);
  const failed = teams.isError || fixtures.isError;
  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/home'))} />
        <Text accessibilityRole="header" style={styles.title}>Calendar</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <View style={styles.monthBar}>
          <AppIconTile icon={ChevronLeft} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} />
          <Text style={styles.month} accessibilityLiveRegion="polite">{format(month, 'MMMM yyyy')}</Text>
          <AppIconTile icon={ChevronRight} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel="Next month" onPress={() => moveMonth(1)} />
        </View>
        <MonthGrid month={month} selected={selected} today={today} gameDays={gameDays} onSelect={setSelected} />
        <Text style={styles.dayTitle}>{format(new Date(`${selected}T00:00:00`), 'EEEE, d MMMM')}</Text>
        {pending ? (
          <ActivityIndicator color={colors.link} accessibilityLabel="Loading your games" style={styles.status} />
        ) : failed ? (
          <View style={styles.center}>
            <Text muted accessibilityLiveRegion="polite">Couldn’t load your games.</Text>
            <Button label="Try again" variant="secondary" size="compact"
              onPress={() => { void teams.refetch(); void fixtures.refetch(); }} />
          </View>
        ) : teamIds.length === 0 ? (
          <View style={styles.center}>
            <Text muted style={styles.centerText}>Your games show here once you’re in a team.</Text>
            <Button label="Find a team" size="compact" onPress={() => router.push('/search')} />
          </View>
        ) : (
          <DayFixtures fixtures={dayList} onOpen={open} />
        )}
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
    title: { flex: 1, ...typography.headlineLg },
    content: { paddingHorizontal: sizes.gutter, gap: spacing.lg, maxWidth: dp(600), width: '100%', alignSelf: 'center' },
    monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    month: { ...typography.headlineMd, color: colors.text },
    dayTitle: { ...typography.labelMd, color: colors.textMuted },
    status: { paddingVertical: spacing.xl },
    center: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
    centerText: { textAlign: 'center' },
  });
