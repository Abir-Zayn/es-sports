import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { INVITES_ENABLED, MAX_MODERATORS, moderatorCount, type Capabilities } from '../permissions';
import type { Roster, StaffMember } from '../types';
import { PersonRow } from './person-row';

type Props = {
  roster: Roster;
  meId: string;
  caps: Capabilities;
  busy: boolean;
  onInvite: () => void;
  onRemove: (member: StaffMember) => void;
  /** Sends a fresh request to someone who declined. */
  onReinvite?: (member: StaffMember) => void;
};

function badgeOf(member: StaffMember): { label: string; tone: 'primary' | 'muted' } {
  if (member.role === 'owner') return { label: 'Owner', tone: 'primary' };
  if (member.status === 'pending') return { label: 'Invited', tone: 'muted' };
  if (member.status === 'declined') return { label: 'Declined', tone: 'muted' };
  return { label: 'Moderator', tone: 'primary' };
}

/** What the viewer may do with one staff row: the owner settles moderators, a moderator may step down. */
function actionOf(member: StaffMember, meId: string, caps: Capabilities): { label: string; a11y: string; reinvite: boolean } | null {
  const name = member.user.name;
  if (member.role === 'owner' || caps.settleInvites === false) return null;
  if (caps.manageStaff) {
    if (member.status === 'declined') return INVITES_ENABLED ? { label: 'Re-invite', a11y: `Re-invite ${name}`, reinvite: true } : null;
    return member.status === 'pending'
      ? { label: 'Cancel', a11y: `Cancel invite for ${name}`, reinvite: false }
      : { label: 'Remove', a11y: `Remove ${name}`, reinvite: false };
  }
  return member.user.id === meId && member.status === 'accepted' ? { label: 'Leave', a11y: 'Step down as moderator', reinvite: false } : null;
}

/** The owner and up to two moderators. Only the owner invites or removes moderators; a moderator may leave. */
export function StaffSection({ roster, meId, caps, busy, onInvite, onRemove, onReinvite }: Props) {
  const styles = useThemedStyles(createStyles);
  const count = moderatorCount(roster);
  return (
    <Card style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Tournament staff
        </Text>
        <Text style={styles.count}>
          {count}/{MAX_MODERATORS} moderators
        </Text>
      </View>
      <Text variant="caption" muted>
        {INVITES_ENABLED ? 'Moderators can add teams and invite team owners. Only you can change the staff or disband a team.' : 'Only you can change the staff or disband a team.'}
      </Text>
      <View>
        {roster.staff.map((member) => {
          const action = actionOf(member, meId, caps);
          const press = action?.reinvite ? onReinvite : onRemove;
          return (
            <PersonRow
              key={member.user.id}
              user={member.user}
              detail={member.user.id === meId ? 'You' : member.user.area}
              badge={badgeOf(member)}
              trailing={
                action && press ? (
                  <View>
                    <Button
                      label={action.label}
                      variant={action.reinvite ? 'secondary' : 'ghost'}
                      size="compact"
                      disabled={busy || (action.reinvite && count >= MAX_MODERATORS)}
                      accessibilityLabel={action.a11y}
                      onPress={() => press(member)}
                    />
                  </View>
                ) : null
              }
            />
          );
        })}
      </View>
      {caps.manageStaff && INVITES_ENABLED ? (
        <Button label="Invite moderator" variant="secondary" disabled={busy || count >= MAX_MODERATORS} onPress={onInvite} />
      ) : null}
    </Card>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    heading: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
    title: typography.headlineMd,
    count: { ...typography.labelSm, color: colors.textMuted, fontVariant: ['tabular-nums'] },
  });
