import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Pencil from 'lucide-react-native/icons/pencil';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { matchLabel: string; onPickMatch: () => void; onEdit: () => void };

/** Which match the squad is for, with a button to change it, and an edit button for the team manager. */
export function SquadMatchPicker({ matchLabel, onPickMatch, onEdit }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Squad for ${matchLabel}. Change match`}
        onPress={onPickMatch}
        style={({ pressed }) => [styles.picker, pressed && styles.pressed]}
      >
        <View style={styles.text}>
          <Text muted style={styles.caption}>
            Squad for
          </Text>
          <Text style={styles.match} numberOfLines={1}>
            {matchLabel}
          </Text>
        </View>
        <ChevronDown size={sizes.iconSmall} color={colors.textMuted} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit squad (team manager only)"
        onPress={onEdit}
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
      >
        <Pencil size={dp(20)} color={colors.link} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.md },
    picker: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      ...shadows.card,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    text: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    caption: typography.bodySm,
    match: typography.bodyMd,
    edit: {
      width: dp(56),
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
