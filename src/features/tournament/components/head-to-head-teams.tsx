import ChevronDown from 'lucide-react-native/icons/chevron-down';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';
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
      <InitialsAvatar label={team.short} tone={team.tone} imageUri={team.avatarUri} size={dp(68)} />
      <Text style={styles.name}>{team.name}</Text>
      <View style={styles.change}>
        <Text muted style={styles.changeText}>
          Change
        </Text>
        <ChevronDown size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2.4} />
      </View>
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sizes.cardPaddingTight,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    slot: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.sm },
    pressed: { transform: [{ scale: 0.95 }] },
    name: { ...typography.bodyMd, textAlign: 'center' },
    change: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    changeText: typography.labelSm,
    vs: { width: dp(48), ...typography.headlineLg, fontStyle: 'italic', textAlign: 'center', color: colors.link },
  });
