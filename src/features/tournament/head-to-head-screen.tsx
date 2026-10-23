import ChevronLeft from 'lucide-react-native/icons/chevron-left';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { useOpenMatch } from '@/features/match/use-match-routes';
import { comingSoon } from '@/lib/coming-soon';
import { radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { HeadToHeadScope } from '@/types/cricket';

import { HeadToHeadRecord } from './components/head-to-head-record';
import { HeadToHeadStatRow } from './components/head-to-head-stat-row';
import { HeadToHeadTeams } from './components/head-to-head-teams';
import { MeetingRow } from './components/meeting-row';
import { strikersVsKings } from './sample-head-to-head';
import { useTournamentRoutes } from './use-tournament-routes';

const scopeOptions: SegmentedOption<HeadToHeadScope>[] = [
  { id: 'all', label: 'All time' },
  { id: 'season', label: 'This season' },
];

/** Compares two teams: their record, stat-by-stat bars and their recent meetings. */
export function HeadToHeadScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { goBack } = useTournamentRoutes(id ?? 't1');
  const openMatch = useOpenMatch();
  const [scope, setScope] = useState<HeadToHeadScope>('all');

  const { teamA, teamB, figures, meetings } = strikersVsKings;
  const current = figures[scope];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <AppIconTile
          icon={ChevronLeft}
          size={44}
          borderRadius={radius.pill}
          backgroundColor={colors.surface}
          borderColor={colors.border}
          borderWidth={1}
          accessibilityLabel="Back"
          onPress={goBack}
        />
        <Text accessibilityRole="header" style={styles.title}>
          Head to head
        </Text>
      </View>

      <View style={styles.body}>
        <HeadToHeadTeams
          teamA={teamA}
          teamB={teamB}
          onChangeA={() => comingSoon('Choosing a team')}
          onChangeB={() => comingSoon('Choosing a team')}
        />
        <SegmentedControl options={scopeOptions} selected={scope} onSelect={setScope} accessibilityLabel="Scope" />
        <HeadToHeadRecord
          teamA={teamA}
          teamB={teamB}
          played={current.played}
          winsA={current.winsA}
          winsB={current.winsB}
        />
        <View style={styles.stats}>
          {current.stats.map((stat) => (
            <HeadToHeadStatRow key={stat.label} stat={stat} toneA={teamA.tone} toneB={teamB.tone} />
          ))}
        </View>
        <View style={styles.meetings}>
          <Text accessibilityRole="header" style={styles.meetingsTitle}>
            Recent meetings
          </Text>
          {meetings.map((meeting) => (
            <MeetingRow
              key={meeting.id}
              meeting={meeting}
              winner={meeting.winner === 'a' ? teamA : teamB}
              onPress={() => openMatch(meeting.id, 'result')}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingBottom: spacing.xxl + spacing.xl },
    header: { paddingHorizontal: sizes.gutter, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    title: { flex: 1, fontSize: 24, lineHeight: 30, fontWeight: '800' },
    body: { paddingHorizontal: sizes.gutter, paddingTop: 22, gap: 22 },
    stats: { gap: spacing.lg },
    meetings: { gap: 10 },
    meetingsTitle: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
  });
