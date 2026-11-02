import { Button } from '@/components/ui';
import { availabilityLabel } from '@/features/team';

import { PersonRow } from '../../roster/components/person-row';
import type { SquadCandidate } from './squad-server';

type Props = { candidate: SquadCandidate; inSquad: boolean; disabled: boolean; showAction: boolean; onToggle: () => void };

/** "Injured · in Kings XI", "Resting", or null for an available player free to pick. */
function detailOf(candidate: SquadCandidate): string | null {
  const parts = [
    candidate.availability === 'available' ? null : availabilityLabel[candidate.availability],
    candidate.takenBy ? `in ${candidate.takenBy}` : null,
  ];
  const text = parts.filter(Boolean).join(' · ');
  return text || null;
}

/** One team member, whether they are in the squad, and the button that adds or takes them out. */
export function CandidateRow({ candidate, inSquad, disabled, showAction, onToggle }: Props) {
  return (
    <PersonRow
      user={{ id: candidate.profileId, name: candidate.name, area: null, avatarUrl: candidate.avatarUrl }}
      detail={detailOf(candidate)}
      badge={inSquad ? { label: 'In squad', tone: 'primary' } : undefined}
      trailing={showAction ? (
        <Button
          label={inSquad ? 'Remove' : 'Add'}
          variant={inSquad ? 'ghost' : 'secondary'}
          size="compact"
          disabled={disabled}
          accessibilityLabel={inSquad ? `Take ${candidate.name} out of the squad` : `Add ${candidate.name} to the squad`}
          onPress={onToggle}
        />
      ) : null}
    />
  );
}
