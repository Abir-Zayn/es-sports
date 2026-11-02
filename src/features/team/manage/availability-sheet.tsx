import { Button, Text } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { useTheme } from '@/theme';

import { availabilityLabel } from '../data/team-management';
import { availabilities, type Availability, type TeamMemberRecord } from '../data/team-repository';

type Props = {
  member: TeamMemberRecord | null;
  busy: boolean;
  error: string | null;
  onChoose: (availability: Availability) => void;
  onClose: () => void;
};

const hint: Record<Availability, string> = {
  available: 'Can be picked for matches.',
  injured: 'Stays in the team and squads, but is not picked until fit again.',
  resting: 'Stays in the team and squads, but sits out for now.',
};

/** Sets one member's availability: available, injured or resting. */
export function AvailabilitySheet({ member, busy, error, onChoose, onClose }: Props) {
  const { colors } = useTheme();
  return (
    <Sheet visible={member !== null} title={member ? `${member.name}'s status` : 'Status'} onClose={onClose}>
      {availabilities.map((item) => (
        <Button
          key={item}
          label={availabilityLabel[item]}
          variant={member?.availability === item ? 'primary' : 'secondary'}
          disabled={busy}
          accessibilityLabel={`${availabilityLabel[item]}${member?.availability === item ? ', current' : ''}. ${hint[item]}`}
          onPress={() => onChoose(item)}
        />
      ))}
      {member ? <Text variant="caption" muted>{hint[member.availability]}</Text> : null}
      {error ? <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>{error}</Text> : null}
    </Sheet>
  );
}
