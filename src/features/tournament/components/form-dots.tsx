import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';
import type { FormResult } from '@/types/cricket';

/** The last few results as small W / L squares. Read out as one phrase. */
export function FormDots({ form }: { form: FormResult[] }) {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessible accessibilityLabel={`Last ${form.length}: ${form.join(' ')}`} style={styles.row}>
      {form.map((result, i) => (
        <View key={i} style={[styles.dot, result === 'W' ? styles.win : styles.loss]}>
          <Text style={[styles.letter, result === 'W' ? styles.winLetter : styles.lossLetter]}>{result}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: 3 },
    dot: { width: 14, height: 14, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
    win: { backgroundColor: colors.primary },
    loss: { backgroundColor: colors.dangerSoft },
    letter: { fontSize: 9, lineHeight: 12, fontWeight: '800' },
    winLetter: { color: colors.primaryText },
    lossLetter: { color: colors.dangerSoftText },
  });
