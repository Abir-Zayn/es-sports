import Clock from 'lucide-react-native/icons/clock';
import ListOrdered from 'lucide-react-native/icons/list-ordered';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { dp, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { CardDivider, SelectionField, SettingsCard } from '../../create/settings-card';
import { perDayOptions, timeLabel } from '../slots';
import type { SlotSettings } from '../types';
import { StartTimeSliders } from './start-time-sliders';

type Props = { settings: SlotSettings; onChange: (next: Partial<SlotSettings>) => void };

/** How many matches a day and when the first one starts. Applied the next time the schedule is drawn. */
export function ScheduleSettings({ settings, onChange }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
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
      <View style={styles.timeBlock}>
        <View style={styles.timeHeader}>
          <Clock size={dp(20)} color={colors.textMuted} strokeWidth={1.6} />
          <Text style={styles.timeLabel}>First match at</Text>
          <Text muted style={styles.timeValue}>
            {timeLabel(settings.firstStartMin)}
          </Text>
        </View>
        <StartTimeSliders
          value={settings.firstStartMin}
          labelPrefix="First match"
          onChange={(firstStartMin) => onChange({ firstStartMin })}
        />
      </View>
    </SettingsCard>
  );
}

const createStyles = (_colors: Palette) =>
  StyleSheet.create({
    timeBlock: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
    timeHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    timeLabel: { flex: 1 },
    timeValue: { ...typography.bodyMd, fontVariant: ['tabular-nums'] },
  });
