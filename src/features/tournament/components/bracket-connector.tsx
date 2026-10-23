import { StyleSheet, View } from 'react-native';

import { useThemedStyles, type Palette } from '@/theme';

export const CONNECTOR_WIDTH = 26;
const LINE = 2;
const ARM = CONNECTOR_WIDTH / 2;

/** Joins two stacked cards on the left to one card on the right. Stretches to the height of its row. */
export function BracketConnector() {
  const styles = useThemedStyles(createStyles);
  return (
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.box}>
      <View style={[styles.arm, { top: '25%' }]} />
      <View style={[styles.arm, { top: '75%' }]} />
      <View style={styles.spine} />
      <View style={styles.out} />
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    box: { width: CONNECTOR_WIDTH, alignSelf: 'stretch' },
    arm: { position: 'absolute', left: 0, width: ARM, height: LINE, marginTop: -LINE / 2, backgroundColor: colors.outline },
    spine: { position: 'absolute', left: ARM - LINE / 2, top: '25%', bottom: '25%', width: LINE, backgroundColor: colors.outline },
    out: { position: 'absolute', left: ARM, right: 0, top: '50%', height: LINE, marginTop: -LINE / 2, backgroundColor: colors.outline },
  });
