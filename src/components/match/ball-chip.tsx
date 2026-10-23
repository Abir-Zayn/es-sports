import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

const EXTRAS = ['Wd', 'Nb', 'Lb', 'B'];

type Props = {
  value: string;
  size?: number;
};

/**
 * One ball of an over: a run count, a boundary, a wicket ("W"), or an extra ("Wd", "Nb", "Lb", "B").
 * An empty value is a ball yet to be bowled, drawn as a dashed ring.
 */
export function BallChip({ value, size = 24 }: Props) {
  const { colors } = useTheme();
  const large = size > 30;
  let background = colors.surfaceRaised;
  let color = colors.text;
  let fontSize = large ? 13 : 11;
  if (value === 'W') {
    background = colors.dangerSoft;
    color = colors.dangerSoftText;
  } else if (value === '4' || value === '6') {
    background = colors.primary;
    color = colors.primaryText;
  } else if (EXTRAS.includes(value)) {
    background = colors.accentSoft;
    color = colors.accent;
    fontSize = large ? 11 : 9;
  }
  const empty = value === '';
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.chip,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: empty ? 'transparent' : background },
        empty && { borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.outline },
      ]}
    >
      {empty ? null : <Text style={{ color, fontSize, lineHeight: fontSize + 3, fontWeight: '700' }}>{value}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
});
