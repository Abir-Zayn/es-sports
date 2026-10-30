import Plus from 'lucide-react-native/icons/plus';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppTabs, Button, Text } from '@/components/ui';
import { sizes, useTheme, useThemedStyles } from '@/theme';

import { MemberRow } from './components/member-row';
import { TeamScreenFrame } from './components/team-screen-frame';
import { getTeamProfile } from './sample-team';
import type { MemberKind } from './types';

type MemberFilter = 'all' | MemberKind;

const filters: { id: MemberFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'bat', label: 'Batters' },
  { id: 'ar', label: 'All-rounders' },
  { id: 'bowl', label: 'Bowlers' },
  { id: 'staff', label: 'Staff' },
];

/** Everyone attached to the team, filterable by role, with an invite button. */
export function TeamMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const teamId = id ?? 'CS';
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { team, members } = getTeamProfile(teamId);
  const [filter, setFilter] = useState<MemberFilter>('all');

  const staffCount = members.filter((m) => m.kind === 'staff').length;
  const playerCount = members.length - staffCount;
  const shown = members.filter((m) => filter === 'all' || m.kind === filter);

  return (
    <TeamScreenFrame teamId={teamId} tab="members">
      <View style={styles.summary}>
        <Text muted style={styles.counts}>
          <Text style={styles.countValue}>{playerCount}</Text> players · <Text style={styles.countValue}>{staffCount}</Text> staff
        </Text>
        <Button
          size="compact"
          label="Invite player"
          leading={<Plus size={16} color={colors.primaryText} strokeWidth={2.6} />}
          onPress={() => router.push('/tournament/squad')}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
        <AppTabs tabs={filters} selected={filter} onSelect={setFilter} />
      </ScrollView>
      <View>
        {shown.map((member) => (
          <MemberRow
            key={member.name}
            member={member}
            tone={team.tone}
            onPress={() => router.push({ pathname: '/player/[id]', params: { id: member.name, name: member.name, role: member.detail } })}
          />
        ))}
      </View>
    </TeamScreenFrame>
  );
}

const createStyles = () =>
  StyleSheet.create({
    summary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    counts: { fontSize: 13, lineHeight: 18 },
    countValue: { fontSize: 13, lineHeight: 18, fontWeight: '700' },
    // Lets the chips scroll edge to edge while the rest of the screen keeps its gutter.
    chipScroll: { marginHorizontal: -sizes.gutter, flexGrow: 0 },
    chips: { paddingHorizontal: sizes.gutter },
  });
