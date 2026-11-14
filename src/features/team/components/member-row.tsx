import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { initialsOf } from '@/lib/initials';
import { radius, sizes, spacing, typography, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import type { MemberTag, TeamMember } from '../types';

type Props = { member: TeamMember; tone: AvatarTone; onPress?: () => void };

/** A player or staff member: avatar, name, role detail and an optional status tag. Invited players are dashed. */
export function MemberRow({ member, tone, onPress }: Props) {
  const styles = useThemedStyles(createStyles);
  const ring = useToneColors()(tone).fill;
  const invited = member.tag === 'Invited';
  const staff = member.kind === 'staff';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${member.name}, ${member.detail}${member.tag ? `, ${member.tag}` : ''}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.avatar, invited ? styles.avatarInvited : staff ? styles.avatarStaff : { borderColor: ring }]}>
        <Text style={[styles.initials, invited && styles.mutedInk]}>{initialsOf(member.name)}</Text>
      </View>
      <View style={styles.text}>
        <Text style={styles.name}>{member.name}</Text>
        <Text muted style={styles.detail}>
          {member.detail}
        </Text>
      </View>
      {member.tag ? <TagChip tag={member.tag} /> : null}
    </Pressable>
  );
}

function TagChip({ tag }: { tag: MemberTag }) {
  const styles = useThemedStyles(createStyles);
  const kind = tag === 'Invited' ? styles.chipInvited : tag === 'Captain' || tag === 'Keeper' ? styles.chipRole : styles.chipStaff;
  const ink = tag === 'Invited' ? styles.inkInvited : tag === 'Captain' || tag === 'Keeper' ? styles.inkRole : styles.inkStaff;
  return (
    <View style={[styles.chip, kind]}>
      <Text style={[styles.chipText, ink]}>{tag}</Text>
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: { transform: [{ scale: 0.95 }] },
    avatar: {
      width: sizes.avatar,
      height: sizes.avatar,
      borderRadius: radius.pill,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInvited: { backgroundColor: colors.surface, borderStyle: 'dashed', borderColor: colors.outline },
    avatarStaff: { borderColor: colors.border },
    initials: typography.labelMd,
    mutedInk: { color: colors.textMuted },
    text: { flex: 1, minWidth: 0, gap: spacing.xs / 2 },
    name: typography.bodyMd,
    detail: typography.bodySm,
    chip: { paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: radius.pill },
    chipText: typography.labelSm,
    chipInvited: { backgroundColor: colors.accentSoft },
    inkInvited: { color: colors.accent },
    chipRole: { backgroundColor: colors.primarySoft },
    inkRole: { color: colors.link },
    chipStaff: { backgroundColor: colors.surfaceRaised },
    inkStaff: { color: colors.textMuted },
  });
