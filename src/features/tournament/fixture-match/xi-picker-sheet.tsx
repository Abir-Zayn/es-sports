import { ScrollView, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { PersonRow } from '../roster/components/person-row';
import { Sheet } from '../roster/components/sheet';
import type { ServerSquad } from '../squad/server/squad-server';

type Props = { visible: boolean; squad: ServerSquad; selected: string[]; limit: number; onChange: (ids: string[]) => void; onClose: () => void };

/** Only registered, available players can be selected; injured and resting players remain visible. */
export function XiPickerSheet({ visible, squad, selected, limit, onChange, onClose }: Props) {
  const candidates = squad.candidates.filter((candidate) => squad.selectedIds.includes(candidate.profileId));
  return <Sheet visible={visible} title={`${squad.teamName} playing XI`} onClose={onClose} fill>
    <Text muted>{`${selected.length}/${limit} players selected`}</Text>
    <ScrollView contentContainerStyle={{ gap: spacing.xs }}>
      {candidates.length === 0 ? <Text muted>No registered squad players.</Text> : candidates.map((candidate) => {
        const chosen = selected.includes(candidate.profileId);
        const disabled = candidate.availability !== 'available' || (!chosen && selected.length >= limit);
        return <PersonRow key={candidate.profileId} user={{ id: candidate.profileId, name: candidate.name, area: null, avatarUrl: candidate.avatarUrl }}
          detail={candidate.availability === 'available' ? null : candidate.availability}
          trailing={<View><Button label={chosen ? 'Remove' : 'Add'} variant="secondary" size="compact" disabled={disabled}
            accessibilityLabel={`${chosen ? 'Remove' : 'Add'} ${candidate.name}`}
            onPress={() => onChange(chosen ? selected.filter((id) => id !== candidate.profileId) : [...selected, candidate.profileId])} /></View>} />;
      })}
    </ScrollView>
    <Button label="Done" onPress={onClose} />
  </Sheet>;
}
