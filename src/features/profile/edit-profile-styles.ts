import { StyleSheet } from 'react-native';

import { radius, sizes, spacing, type Palette } from '@/theme';

export const createEditProfileStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    flex: { flex: 1 },
    content: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, paddingBottom: spacing.xxl, gap: spacing.xl },
    photo: { alignItems: 'center', gap: spacing.sm },
    photoActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xl },
    photoButton: { minHeight: 44, justifyContent: 'center' },
    remove: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.textMuted },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg, paddingHorizontal: sizes.gutter },
    link: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: colors.link },
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
      minWidth: 64,
      minHeight: 44,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipLabel: { fontSize: 14, lineHeight: 20, fontWeight: '600' },
    chipLabelOn: { color: colors.primaryText },
  });
