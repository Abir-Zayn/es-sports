import ChevronDown from 'lucide-react-native/icons/chevron-down';
import Pencil from 'lucide-react-native/icons/pencil';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

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
        <ChevronDown size={16} color={colors.textMuted} strokeWidth={2.2} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Edit squad (team manager only)"
        onPress={onEdit}
        style={({ pressed }) => [styles.edit, pressed && styles.pressed]}
      >
        <Pencil size={20} color={colors.link} />
      </Pressable>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 10 },
    picker: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.8 },
    text: { flex: 1, minWidth: 0, gap: 2 },
    caption: { fontSize: 11, lineHeight: 14 },
    match: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
    edit: {
      width: 56,
      borderRadius: 16,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primaryDeep,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
