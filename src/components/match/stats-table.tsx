import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, radius, shadows, spacing, typography, useThemedStyles, type Palette } from '@/theme';

export type StatsColumn = {
  label: string;
  width: number;
  /** Draws this column's figures large and bold, e.g. runs or wickets. */
  emphasis?: boolean;
};

export type StatsRow = {
  key: string;
  name: string;
  /** A second line under the name, e.g. how a batter was out. */
  detail?: string;
  /** Colours the detail line as a highlight, e.g. "not out". */
  detailHighlight?: boolean;
  /** Dot after the name, e.g. for the batter on strike. */
  marker?: boolean;
  markerLabel?: string;
  /** One value per column. */
  values: string[];
};

type Props = {
  nameHeading: string;
  columns: StatsColumn[];
  rows: StatsRow[];
  /** Extra rows inside the card under the table, e.g. extras and the total. */
  children?: ReactNode;
};

/** A boxed table with a name column and fixed-width figure columns. Batting and bowling cards use it. */
export function StatsTable({ nameHeading, columns, rows, children }: Props) {
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.card}>
      <View style={[styles.row, styles.head]}>
        <Text style={[styles.headText, styles.name]}>{nameHeading}</Text>
        {columns.map((column) => (
          <Text key={column.label} style={[styles.headText, { width: column.width }, styles.right]}>
            {column.label}
          </Text>
        ))}
      </View>
      {rows.map((row, i) => (
        <View
          key={row.key}
          accessible
          accessibilityLabel={`${row.name}${row.detail ? `, ${row.detail}` : ''}. ${columns
            .map((column, c) => `${column.label} ${row.values[c]}`)
            .join(', ')}`}
          style={[styles.row, (i < rows.length - 1 || !!children) && styles.divider]}
        >
          <View style={styles.name}>
            <View style={styles.nameLine}>
              <Text style={styles.nameText} numberOfLines={1}>
                {row.name}
              </Text>
              {row.marker ? <View accessibilityLabel={row.markerLabel} style={styles.marker} /> : null}
            </View>
            {row.detail ? (
              <Text style={[styles.detail, row.detailHighlight && styles.detailHighlight]} numberOfLines={1}>
                {row.detail}
              </Text>
            ) : null}
          </View>
          {columns.map((column, c) => (
            <Text
              key={column.label}
              style={[styles.value, column.emphasis && styles.emphasis, { width: column.width }, styles.right]}
            >
              {row.values[c]}
            </Text>
          ))}
        </View>
      ))}
      {children}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderRadius: radius.lg, backgroundColor: colors.surface, ...shadows.card },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
    head: { borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: spacing.md },
    divider: { borderBottomWidth: 1, borderBottomColor: colors.border },
    headText: { ...typography.labelSm, color: colors.textMuted },
    right: { textAlign: 'right' },
    name: { flex: 1, minWidth: 0, gap: dp(2) },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    nameText: { ...typography.bodyMd, flexShrink: 1, color: colors.text },
    marker: { width: dp(6), height: dp(6), borderRadius: radius.pill, backgroundColor: colors.accent },
    detail: { ...typography.bodySm, color: colors.textMuted },
    detailHighlight: { color: colors.link },
    value: { ...typography.bodyMd, color: colors.textMuted, fontVariant: ['tabular-nums'] },
    emphasis: { fontWeight: typography.headlineMd.fontWeight, color: colors.text },
  });
