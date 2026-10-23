import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppAvatar, SegmentedControl, Text, type SegmentedOption } from '@/components/ui';
import { comingSoon } from '@/lib/coming-soon';
import { initialsOf } from '@/lib/initials';
import { useThemedStyles, type Palette } from '@/theme';

import type { MatchInfoData } from '../types';

/** Both squads: pick a team, then see its playing XI and the bench. */
export function SquadsSection({ squads }: { squads: MatchInfoData['squads'] }) {
  const styles = useThemedStyles(createStyles);
  const [selected, setSelected] = useState(squads[0].team.short);
  const squad = squads.find((s) => s.team.short === selected) ?? squads[0];
  const options: SegmentedOption<string>[] = squads.map((s) => ({ id: s.team.short, label: s.team.name }));

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Squads
      </Text>
      <SegmentedControl options={options} selected={selected} onSelect={setSelected} height={40} accessibilityLabel="Team" />

      <Text muted style={styles.heading}>
        PLAYING XI
      </Text>
      <View style={styles.grid}>
        {squad.playingXi.map((player) => (
          <Pressable
            key={player.name}
            accessibilityRole="button"
            accessibilityLabel={`${player.name}, ${player.role}`}
            onPress={() => comingSoon('Player')}
            style={({ pressed }) => [styles.player, pressed && styles.pressed]}
          >
            <AppAvatar label={initialsOf(player.name)} size={32} />
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
    section: { gap: 12 },
    title: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    heading: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1.5 },
    benchHeading: { marginTop: 6 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    player: {
      width: '48.5%',
      flexGrow: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    playerText: { flex: 1, minWidth: 0, gap: 1 },
    playerName: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
    playerRole: { fontSize: 11, lineHeight: 14 },
    bench: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    chip: { paddingVertical: 7, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: colors.border },
    chipText: { fontSize: 13, lineHeight: 18 },
  });
