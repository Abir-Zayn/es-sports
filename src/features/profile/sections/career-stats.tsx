import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Section, SectionHeader, Text } from '@/components/ui';
import { sizes, spacing, useThemedStyles, type Palette } from '@/theme';
import type { BattingStats, BowlingStats } from '@/types/profile';

type Mode = 'bat' | 'bowl';

type Props = {
  batting: BattingStats;
  bowling: BowlingStats;
  onFindTeam: () => void;
};

const modes = [
  { id: 'bat' as const, label: 'Batting', icon: require('../../../../assets/images/career-bat.svg') },
  { id: 'bowl' as const, label: 'Bowling', icon: require('../../../../assets/images/career-ball.svg') },
];

function battingCells(s: BattingStats): [string, string | number][] {
  return [
    ['Matches', s.matches],
    ['Innings', s.innings],
    ['Runs', s.runs],
    ['Highest', s.highest],
    ['Average', s.average],
    ['Strike rate', s.strikeRate],
    ['50s', s.fifties],
    ['100s', s.hundreds],
  ];
}

function bowlingCells(s: BowlingStats): [string, string | number][] {
  return [
    ['Matches', s.matches],
    ['Overs', s.overs],
    ['Wickets', s.wickets],
    ['Best', s.best],
    ['Economy', s.economy],
    ['Average', s.average],
    ['3W', s.threeW],
    ['5W', s.fiveW],
  ];
}

/** Career figures with a Bat / Bowl switch. With no matches played it invites the player to join a team. */
export function CareerStats({ batting, bowling, onFindTeam }: Props) {
  const styles = useThemedStyles(createStyles);
  const [mode, setMode] = useState<Mode>('bat');
  const empty = batting.matches === 0 && bowling.matches === 0;
  const cells = mode === 'bat' ? battingCells(batting) : bowlingCells(bowling);

  return (
    <Section>
      <SectionHeader title="Career" />
      <View style={styles.body}>
        {empty ? (
          <View style={styles.empty}>
            <Text muted style={styles.emptyText}>
              No matches yet. Join a team to start building your record.
            </Text>
            <Button label="Find a team" size="compact" onPress={onFindTeam} />
          </View>
        ) : (
          <>
            <View style={styles.modes} accessibilityRole="tablist" accessibilityLabel="Career stats type">
              {modes.map((option) => (
                <Pressable
                  key={option.id}
                  accessibilityRole="tab"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: mode === option.id }}
                  onPress={() => setMode(option.id)}
                  style={[styles.mode, mode === option.id && styles.modeSelected]}
                >
                  <Image source={option.icon} style={styles.modeIcon} contentFit="contain" accessibilityElementsHidden />
                </Pressable>
              ))}
            </View>
            <View style={styles.grid}>
              {cells.map(([label, value]) => (
                <View key={label} accessible accessibilityLabel={`${label} ${value}`} style={styles.cell}>
                  <Text style={styles.value}>{value}</Text>
                  <Text muted style={styles.label}>
                    {label}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Section>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    body: { paddingHorizontal: sizes.gutter, gap: spacing.md },
    modes: { flexDirection: 'row', gap: spacing.sm },
    mode: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    modeSelected: { backgroundColor: colors.primary },
    modeIcon: { width: 28, height: 28 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cell: {
      // Two per row: half the width minus half the gap.
      flexBasis: '48.5%',
      flexGrow: 1,
      gap: 2,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: 12,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    value: { fontSize: 20, lineHeight: 26, fontWeight: '700', fontVariant: ['tabular-nums'] },
    label: { fontSize: 12, lineHeight: 16 },
    empty: {
      gap: spacing.md,
      alignItems: 'flex-start',
      padding: spacing.lg,
      borderRadius: 20,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    emptyText: { fontSize: 14, lineHeight: 20 },
  });
