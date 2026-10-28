import Clock from 'lucide-react-native/icons/clock';
import ListOrdered from 'lucide-react-native/icons/list-ordered';

import { CardDivider, SelectionField, SettingsCard } from '../../create/settings-card';
import { firstStartOptions, perDayOptions, timeLabel } from '../slots';
import type { SlotSettings } from '../types';

type Props = { settings: SlotSettings; onChange: (next: Partial<SlotSettings>) => void };

/** How many matches a day and when the first one starts. Applied the next time the schedule is drawn. */
export function ScheduleSettings({ settings, onChange }: Props) {
  return (
    <SettingsCard>
      <SelectionField
        label="Matches per day"
        icon={ListOrdered}
        value={settings.perDay}
        options={perDayOptions.map((value) => ({ value, label: value === 1 ? '1 match' : `${value} matches` }))}
        onChange={(perDay) => onChange({ perDay })}
      />
      <CardDivider />
      <SelectionField
        label="First match at"
        icon={Clock}
        value={settings.firstStartMin}
        options={firstStartOptions.map((value) => ({ value, label: timeLabel(value) }))}
        onChange={(firstStartMin) => onChange({ firstStartMin })}
      />
    </SettingsCard>
  );
}
