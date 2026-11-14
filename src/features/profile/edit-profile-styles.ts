import { StyleSheet } from 'react-native';

import { dp, radius, sizes, spacing, typography, type Palette } from '@/theme';

export const createEditProfileStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl },
    photo: { alignItems: 'center', gap: spacing.sm },
    photoActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    photoButton: { minHeight: dp(44), justifyContent: 'center' },
    remove: { ...typography.labelMd, color: colors.textMuted },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter },
    link: { ...typography.labelMd, color: colors.link },
    error: { color: colors.danger },
    fields: { gap: spacing.lg },
    field: { gap: spacing.xs },
    readOnly: { gap: spacing.xs, opacity: 0.7 },
    group: { gap: spacing.sm },
    roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    // Two per row: half the width minus half the gap.
    roleCell: { flexBasis: '48.5%', flexGrow: 1 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      minWidth: dp(64),
      minHeight: dp(44),
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceRaised,
    },
    chipOn: { backgroundColor: colors.primarySoft },
    chipLabel: { ...typography.labelSm, color: colors.textMuted },
    chipLabelOn: { color: colors.link },
  });
