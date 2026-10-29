import { StyleSheet, View } from 'react-native';

import { SegmentedControl, Text, TextField } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { playerRoles, type PlayerRole } from '../../roster/types';

const roleOptions = playerRoles.map((id) => ({ id, label: id === 'All-rounder' ? 'All-round' : id }));

type Props = {
  role: PlayerRole;
  onRole: (role: PlayerRole) => void;
  /** After the rosters lock, a change needs a reason, which the organisers see. */
  locked: boolean;
  reason: string;
  onReason: (reason: string) => void;
};

/** The new player's role, and the reason for the change once the rosters are locked. */
export function PlayerChangeFields({ role, onRole, locked, reason, onReason }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.stack}>
      <SegmentedControl options={roleOptions} selected={role} onSelect={onRole} accessibilityLabel="Playing role" />
      {locked ? (
        <>
          <Text variant="caption" style={{ color: colors.accent }}>
            Rosters are locked. The tournament owner and moderators will be alerted.
          </Text>
          <TextField label="Reason" value={reason} onChangeText={onReason} placeholder="e.g. Injury replacement" maxLength={120} />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: spacing.md },
});
