import Minus from 'lucide-react-native/icons/minus';
import Plus from 'lucide-react-native/icons/plus';
import Shirt from 'lucide-react-native/icons/shirt';
import { StyleSheet, View } from 'react-native';

import { AppIconTile, Text } from '@/components/ui';
import { radius, spacing, useThemedStyles, type Palette } from '@/theme';

import { DatePicker } from './date-picker';
import type { DraftErrors, TournamentDraft } from './draft';
import { CardDivider, SelectionField, SettingsCard } from './settings-card';
import { describeRules, presetRules, SQUAD_LIMITS, sideFormatPresets, type SideFormat } from './squad-formats';

type Props = {
  draft: TournamentDraft; errors: DraftErrors;
  onChange: <K extends keyof TournamentDraft>(key: K, value: TournamentDraft[K]) => void;
};

/** Players a side and squad size, from a preset or set by hand, then the window in which teams register players. */
export function SquadFormatFields({ draft, errors, onChange }: Props) {
  const styles = useThemedStyles(createStyles);
  function chooseFormat(format: SideFormat) {
    onChange('sideFormat', format);
    const rules = presetRules(format);
    if (!rules) return;
    onChange('playersPerSide', rules.playersPerSide);
    onChange('minSquad', rules.minSquad);
    onChange('maxSquad', rules.maxSquad);
  }
  return <>
    <SettingsCard>
      <SelectionField label="Side format" icon={Shirt} value={draft.sideFormat} options={sideFormatPresets} onChange={chooseFormat} />
      <CardDivider />
      {draft.sideFormat === 'custom' ? <>
        <Stepper label="Players a side" value={draft.playersPerSide} min={SQUAD_LIMITS.sideMin} max={SQUAD_LIMITS.sideMax} onChange={(v) => onChange('playersPerSide', v)} />
        <Stepper label="Smallest squad" value={draft.minSquad} min={SQUAD_LIMITS.sideMin} max={SQUAD_LIMITS.squadMax} onChange={(v) => onChange('minSquad', v)} />
        <Stepper label="Largest squad" value={draft.maxSquad} min={SQUAD_LIMITS.sideMin} max={SQUAD_LIMITS.squadMax} onChange={(v) => onChange('maxSquad', v)} />
      </> : <Text variant="caption" muted style={styles.summary}>{describeRules(draft)}</Text>}
      {errors.maxSquad ? <Text variant="caption" style={styles.error} accessibilityLiveRegion="polite">{errors.maxSquad}</Text> : null}
    </SettingsCard>
    <SettingsCard>
      <DatePicker label="Registration opens" value={draft.registrationOpens} onChange={(v) => onChange('registrationOpens', v)} error={errors.registrationOpens} />
      <CardDivider />
      <DatePicker label="Registration deadline" value={draft.registrationDeadline} minimumDate={draft.registrationOpens}
        onChange={(v) => onChange('registrationDeadline', v)} error={errors.registrationDeadline} />
      <Text variant="caption" muted style={styles.summary}>Team owners add players inside this window. Leave it empty to stay open until the start.</Text>
    </SettingsCard>
  </>;
}

function Stepper({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (value: number) => void }) {
  const styles = useThemedStyles(createStyles);
  return <View style={styles.stepper}>
    <Text style={styles.stepperLabel}>{label}</Text>
    <AppIconTile icon={Minus} size={44} borderRadius={radius.pill} accessibilityLabel={`Fewer: ${label}`} onPress={value > min ? () => onChange(value - 1) : undefined} />
    <Text style={styles.stepperValue} accessibilityLabel={`${label}, ${value}`}>{value}</Text>
    <AppIconTile icon={Plus} size={44} borderRadius={radius.pill} accessibilityLabel={`More: ${label}`} onPress={value < max ? () => onChange(value + 1) : undefined} />
  </View>;
}

const createStyles = (colors: Palette) => StyleSheet.create({
  summary: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  error: { color: colors.dangerSoftText, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  stepper: { minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.xs },
  stepperLabel: { flex: 1 },
  stepperValue: { minWidth: 28, textAlign: 'center', fontWeight: '700', fontVariant: ['tabular-nums'] },
});
