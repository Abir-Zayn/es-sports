import { ScrollView, View } from 'react-native';

import { Button, Checkbox, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { PersonRow } from '../roster/components/person-row';
import { Sheet } from '../roster/components/sheet';
import type { ServerSquad } from '../squad/server/squad-server';
import { pickSquad } from './pick-squad';

type Props = { visible: boolean; squad: ServerSquad; selected: string[]; limit: number; onChange: (ids: string[]) => void; onClose: () => void };

/**
 * Only registered, available players can be selected; injured and resting players remain visible. "Select squad"
 * fills the XI at once: the whole available squad when it fits, otherwise the match's number of players at random.
 * Players can still be swapped one by one afterwards.
 */
export function XiPickerSheet({ visible, squad, selected, limit, onChange, onClose }: Props) {
  const candidates = squad.candidates.filter((candidate) => squad.selectedIds.includes(candidate.profileId));
  const available = candidates.filter((c) => c.availability === 'available').map((c) => c.profileId);
  const full = available.length > 0 && selected.length === Math.min(limit, available.length);
  const random = available.length > limit;
  return <Sheet visible={visible} title={`${squad.teamName} playing XI`} onClose={onClose} fill>
    {available.length > 0 ? (
      <Checkbox checked={full} onChange={(on) => onChange(on ? pickSquad(available, limit) : [])}
        accessibilityLabel={random ? `Select squad: picks ${limit} of ${available.length} players at random` : 'Select squad'}>
        <Text>{random ? `Select squad (${limit} of ${available.length} at random)` : 'Select squad'}</Text>
      </Checkbox>
    ) : null}
    <Text muted accessibilityLiveRegion="polite">{`${selected.length}/${limit} players selected`}</Text>
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
