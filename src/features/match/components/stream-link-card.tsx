import ExternalLink from 'lucide-react-native/icons/external-link';
import Play from 'lucide-react-native/icons/play';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme, useThemedStyles, type Palette } from '@/theme';

type Props = { label: string; source: string; onPress: () => void };

/** A row that opens the match's live video stream. */
export function StreamLinkCard({ label, source, onPress }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${label}. ${source}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.icon, { backgroundColor: colors.live }]}>
        <Play size={18} color={colors.onLive} fill={colors.onLive} />
      </View>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        <Text muted style={styles.source}>
          {source}
        </Text>
      </View>
      <ExternalLink size={18} color={colors.textMuted} />
    </Pressable>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: { opacity: 0.85 },
    icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1, minWidth: 0, gap: 2 },
    label: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
    source: { fontSize: 12, lineHeight: 16 },
  });
