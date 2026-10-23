import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';
import type { TeamInfo } from '@/types/cricket';

type Props = {
  teamA: TeamInfo;
  teamB: TeamInfo;
  onChangeA: () => void;
  onChangeB: () => void;
};

/** The two teams being compared, each a button to swap it, with "VS" between. */
export function HeadToHeadTeams({ teamA, teamB, onChangeA, onChangeB }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <TeamSlot team={teamA} slot="A" onPress={onChangeA} />
      <Text style={styles.vs}>VS</Text>
      <TeamSlot team={teamB} slot="B" onPress={onChangeB} />
    </View>
  );
}

function TeamSlot({ team, slot, onPress }: { team: TeamInfo; slot: 'A' | 'B'; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Change team ${slot}, ${team.name}`}
      onPress={onPress}
      style={({ pressed }) => [styles.slot, pressed && styles.pressed]}
    >
      <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={68} />
      <Text style={styles.name}>{team.name}</Text>
      <View style={styles.change}>
        <Text muted style={styles.changeText}>
          Change
        </Text>
        <ChevronDown size={12} color={colors.textMuted} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 20,
      paddingHorizontal: spacing.lg,
      borderRadius: 24,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    slot: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
    pressed: { opacity: 0.7 },
    name: { fontSize: 14, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
    change: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    changeText: { fontSize: 12, lineHeight: 16 },
    vs: { width: 48, fontSize: 24, lineHeight: 28, fontWeight: '800', fontStyle: 'italic', textAlign: 'center', color: colors.link },
  });
