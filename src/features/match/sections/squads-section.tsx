import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { dp, radius, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import type { MatchInfoData } from '../types';

/** Both squads: pick a team, then see its playing XI and the bench. */
export function SquadsSection({ squads }: { squads: MatchInfoData['squads'] }) {
  const router = useRouter();
  const styles = useThemedStyles(createStyles);
  const [selected, setSelected] = useState(squads[0].team.short);
  const squad = squads.find((s) => s.team.short === selected) ?? squads[0];
  const options: SegmentedOption<string>[] = squads.map((s) => ({ id: s.team.short, label: s.team.name }));

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Squads
      </Text>
      <SegmentedControl options={options} selected={selected} onSelect={setSelected} height={dp(40)} accessibilityLabel="Team" />

      <Text muted style={styles.heading}>
        PLAYING XI
      </Text>
      <View style={styles.grid}>
        {squad.playingXi.map((player) => (
          <Pressable
            key={player.name}
            accessibilityRole="button"
            accessibilityLabel={`${player.name}, ${player.role}`}
            onPress={() => router.push({ pathname: '/player/[id]', params: { id: player.name, name: player.name, role: player.role } })}
            style={({ pressed }) => [styles.player, pressed && styles.pressed]}
          >
            <AppAvatar label={initialsOf(player.name)} size={dp(32)} />
            <View style={styles.playerText}>
              <Text style={styles.playerName} numberOfLines={1}>
                {player.name}
              </Text>
              <Text muted style={styles.playerRole} numberOfLines={1}>
                {player.role}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <Text muted style={[styles.heading, styles.benchHeading]}>
        BENCH
      </Text>
      <View style={styles.bench}>
        {squad.bench.map((name) => (
          <View key={name} style={styles.chip}>
            <Text muted style={styles.chipText}>
              {name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.md },
    title: typography.headlineLg,
    heading: typography.labelUppercase,
    benchHeading: { marginTop: dp(6) },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    player: {
      width: '48.5%',
      flexGrow: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.surfaceRaised,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    playerText: { flex: 1, minWidth: 0, gap: dp(1) },
    playerName: { ...typography.labelMd, color: colors.text },
    playerRole: typography.labelSm,
    bench: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.surfaceRaised },
    chipText: typography.labelSm,
  });
