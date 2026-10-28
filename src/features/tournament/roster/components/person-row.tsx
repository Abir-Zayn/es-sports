import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppBadge, InitialsAvatar, Text } from '@/components/ui';
import { initialsOf } from '@/lib/initials';
import { spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { UserSummary } from '../types';

type Props = {
  user: UserSummary;
  /** Line under the name, e.g. their area or role. */
  detail?: string | null;
  /** A small pill beside the name, e.g. "Owner" or "Invited". */
  badge?: { label: string; tone: 'primary' | 'muted' };
  /** Buttons on the right. */
  trailing?: ReactNode;
};

/** One person as a flat row: photo, name with an optional badge, a detail line, and actions on the right. */
export function PersonRow({ user, detail, badge, trailing }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.row}>
      <InitialsAvatar label={initialsOf(user.name)} imageUri={user.avatarUrl} size={40} />
      <View style={styles.names}>
        <View style={styles.nameLine}>
          <Text style={styles.name} numberOfLines={1}>
            {user.name}
          </Text>
          {badge ? (
            <AppBadge
              label={badge.label}
              backgroundColor={badge.tone === 'primary' ? colors.primarySoft : colors.surfaceRaised}
              color={badge.tone === 'primary' ? colors.link : colors.textMuted}
            />
          ) : null}
        </View>
        {detail ? (
          <Text style={styles.detail} numberOfLines={1}>
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
    names: { flex: 1, minWidth: 0, gap: 2 },
    nameLine: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    name: { flexShrink: 1, fontSize: 15, lineHeight: 20, fontWeight: '700' },
    detail: { fontSize: 12, lineHeight: 16, color: colors.textMuted },
  });
