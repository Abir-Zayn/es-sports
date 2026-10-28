import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { MAX_MODERATORS, moderatorCount, type Capabilities } from '../permissions';
import type { Roster, StaffMember } from '../types';
import { PersonRow } from './person-row';

type Props = {
  roster: Roster;
  meId: string;
  caps: Capabilities;
  busy: boolean;
  onInvite: () => void;
  onRemove: (member: StaffMember) => void;
};

/** The owner and up to two moderators. Only the owner invites or removes moderators. */
export function StaffSection({ roster, meId, caps, busy, onInvite, onRemove }: Props) {
  const styles = useThemedStyles(createStyles);
  const count = moderatorCount(roster);
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Tournament staff
        </Text>
        <Text style={styles.count}>
          {count}/{MAX_MODERATORS} moderators
        </Text>
      </View>
      <Text variant="caption" muted>
        Moderators can add teams and invite team owners. Only you can change the staff or disband a team.
      </Text>
      <View>
        {roster.staff.map((member) => {
          const isOwner = member.role === 'owner';
          const pending = member.status === 'pending';
          return (
            <PersonRow
              key={member.user.id}
              user={member.user}
              detail={member.user.id === meId ? 'You' : member.user.area}
              badge={isOwner ? { label: 'Owner', tone: 'primary' } : { label: pending ? 'Invited' : 'Moderator', tone: pending ? 'muted' : 'primary' }}
              trailing={
                caps.manageStaff && !isOwner ? (
                  <View>
                    <Button
                      label={pending ? 'Cancel' : 'Remove'}
                      variant="ghost"
                      size="compact"
                      disabled={busy}
                      accessibilityLabel={`${pending ? 'Cancel invite for' : 'Remove'} ${member.user.name}`}
                      onPress={() => onRemove(member)}
                    />
                  </View>
                ) : null
              }
            />
          );
        })}
      </View>
      {caps.manageStaff ? (
        <Button label="Invite moderator" variant="secondary" disabled={busy || count >= MAX_MODERATORS} onPress={onInvite} />
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    count: { fontSize: 12, lineHeight: 16, fontWeight: '600', color: colors.textMuted, fontVariant: ['tabular-nums'] },
  });
