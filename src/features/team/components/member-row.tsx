import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useToneColors } from '@/features/tournament/use-tone-colors';
import { initialsOf } from '@/lib/initials';
import { useThemedStyles, type AvatarTone, type Palette } from '@/theme';

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
      gap: 12,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    pressed: { opacity: 0.8 },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.surfaceRaised,
      borderWidth: 1.5,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarInvited: { backgroundColor: colors.surface, borderStyle: 'dashed', borderColor: colors.outline },
    avatarStaff: { borderColor: colors.border },
    initials: { fontSize: 14, lineHeight: 20, fontWeight: '700' },
    mutedInk: { color: colors.textMuted },
    text: { flex: 1, minWidth: 0, gap: 2 },
    name: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
    detail: { fontSize: 12, lineHeight: 16 },
    chip: { paddingVertical: 4, paddingHorizontal: 9, borderRadius: 999 },
    chipText: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
    chipInvited: { backgroundColor: colors.accentSoft },
    inkInvited: { color: colors.accent },
    chipRole: { backgroundColor: colors.primarySoft },
    inkRole: { color: colors.link },
    chipStaff: { backgroundColor: colors.surfaceRaised },
    inkStaff: { color: colors.textMuted },
  });
