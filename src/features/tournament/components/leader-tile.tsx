import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

type Props = {
  /** Player or team name. */
  name: string;
  /** What they lead in, e.g. "Highest runs". */
  award: string;
  /** The figure on the right, e.g. "312" or "176/6". */
  value: string;
  /** Small word after the figure, e.g. "runs". */
  unit?: string;
  /** Initials shown when there is no photo. */
  initials: string;
  tone?: AvatarTone;
  imageUri?: string;
};

const PHOTO_SIZE = 44;

/**
 * One leader as a flat row with no background: photo, the name over the award, and the figure on the right.
 * Stack several in a `LeaderList` to get the hairlines between them.
 */
export function LeaderTile({ name, award, value, unit, initials, tone, imageUri }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`${award}: ${name}, ${value}${unit ? ` ${unit}` : ''}`} style={styles.row}>
      <InitialsAvatar label={initials} tone={tone} imageUri={imageUri} size={PHOTO_SIZE} />
      <View style={styles.names}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        <Text style={styles.award} numberOfLines={1}>
          {award}
        </Text>
      </View>
      <View style={styles.score}>
        <Text style={styles.value}>{value}</Text>
        {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    names: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '700' },
    award: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted },
    score: { alignItems: 'flex-end' },
    value: { fontSize: 20, lineHeight: 24, fontWeight: '800', fontVariant: ['tabular-nums'] },
    unit: { fontSize: 11, lineHeight: 14, color: colors.textMuted },
  });
