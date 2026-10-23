import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

/** Vertical block of one Home section: a header, then its content. */
export function Section({ children }: { children: ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

const styles = StyleSheet.create({
  section: { gap: 14 },
});
