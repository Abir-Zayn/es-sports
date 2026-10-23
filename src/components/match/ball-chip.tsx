import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTheme } from '@/theme';

/** One ball of an over: a run count, a boundary, a wicket ("W"), or an extra ("Wd", "Nb"). */
export function BallChip({ value }: { value: string }) {
  const { colors } = useTheme();
  let background = colors.surfaceRaised;
  let color = colors.text;
  let fontSize = 11;
  if (value === 'W') {
    background = colors.dangerSoft;
    color = colors.dangerSoftText;
  } else if (value === '4' || value === '6') {
    background = colors.primary;
    color = colors.primaryText;
  } else if (value === 'Wd' || value === 'Nb') {
    background = colors.accentSoft;
    color = colors.accent;
    fontSize = 9;
  }
  return (
    <View style={[styles.chip, { backgroundColor: background }]}>
      <Text style={{ color, fontSize, lineHeight: 14, fontWeight: '700' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
