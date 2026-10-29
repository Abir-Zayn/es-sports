import Lock from 'lucide-react-native/icons/lock';
import { StyleSheet, View } from 'react-native';

import { AppBadge, Button, Text } from '@/components/ui';
import { radius, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import { DatePicker } from '../../create/date-picker';
import { formatDate } from '../../create/draft';
import { describeRules } from '../../create/squad-formats';
import type { Capabilities } from '../permissions';
import { registrationLabel, registrationStatus } from '../registration';
import type { Roster } from '../types';

type Props = {
  roster: Roster;
  caps: Capabilities;
  busy: boolean;
  error: string | null;
  onSetDeadline: (deadline: string) => void;
  onClose: () => void;
  onReopen: () => void;
  onLock: () => void;
};

/** The squad sizes and the window for adding players. The owner moves the deadline, closes early, or locks the rosters. */
export function RegistrationSection({ roster, caps, busy, error, onSetDeadline, onClose, onReopen, onLock }: Props) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const status = registrationStatus(roster);
  const open = status === 'open';
  const manage = caps.manageRegistration && !roster.locked;
  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <Text accessibilityRole="header" style={styles.title}>
          Registration
        </Text>
        <AppBadge
          label={registrationLabel(roster)}
          backgroundColor={open ? colors.primarySoft : roster.locked ? colors.accentSoft : colors.surfaceRaised}
          color={open ? colors.link : roster.locked ? colors.accent : colors.textMuted}
        />
      </View>
      <Text variant="caption" muted>
        {describeRules(roster.squadRules)}. Team owners add players while registration is open.
      </Text>
      {manage ? (
        <View style={styles.card}>
          <DatePicker label="Registration deadline" value={roster.registration.deadline} minimumDate={roster.registration.opensOn} onChange={onSetDeadline} />
        </View>
      ) : roster.registration.deadline ? (
        <Text variant="caption" muted>
          Deadline {formatDate(roster.registration.deadline)}
        </Text>
      ) : null}
      {error ? (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      ) : null}
      {roster.locked ? (
        <View style={styles.locked}>
          <Lock size={16} color={colors.accent} />
          <Text variant="caption" style={styles.lockedText}>
            Rosters are locked. Any squad change now needs a reason and alerts the organisers.
          </Text>
        </View>
      ) : null}
      {manage ? (
        <View style={styles.actions}>
          {open ? <Button label="Close now" variant="secondary" size="compact" disabled={busy} onPress={onClose} /> : null}
          {roster.registration.closedEarly ? <Button label="Re-open" variant="secondary" size="compact" disabled={busy} onPress={onReopen} /> : null}
          <Button label="Lock rosters" variant="ghost" size="compact" disabled={busy} onPress={onLock} />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    section: { gap: spacing.sm },
    heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    title: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
    card: { borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
    error: { color: colors.dangerSoftText },
    locked: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    lockedText: { flex: 1, color: colors.accent },
    actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  });
