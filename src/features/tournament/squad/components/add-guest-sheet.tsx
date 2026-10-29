import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { Sheet } from '../../roster/components/sheet';
import type { GuestPlayerInput, PlayerRole } from '../../roster/types';
import { PlayerChangeFields } from './player-change-fields';

type Props = {
  visible: boolean;
  locked: boolean;
  adding: boolean;
  /** Why the last attempt was refused, from the same rules the server applies. */
  error: string | null;
  onAdd: (input: GuestPlayerInput, reason: string) => void;
  onClose: () => void;
  /** What happens after adding, under the fields. */
  note?: string;
};

const GUEST_NOTE = 'You can share a link with them next. When they join, they claim this profile and keep its stats.';

/** Adds a player who is not on the app yet, by name and an optional phone, so match day is never blocked. */
export function AddGuestSheet({ visible, onClose, ...form }: Props) {
  return (
    <Sheet visible={visible} title="Quick add player" onClose={onClose}>
      {/* Mounted only while open, so every opening starts with empty fields. */}
      {visible ? <GuestForm {...form} /> : null}
    </Sheet>
  );
}

function GuestForm({ locked, adding, error, onAdd, note = GUEST_NOTE }: Omit<Props, 'visible' | 'onClose'>) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<PlayerRole>('Batter');
  const [reason, setReason] = useState('');
  return (
    <>
      <View style={styles.fields}>
        <TextField label="Player name" value={name} onChangeText={setName} placeholder="e.g. Liton Roy" maxLength={40} autoCapitalize="words" autoFocus />
        <TextField label="Phone (optional)" value={phone} onChangeText={setPhone} placeholder="e.g. 01712 345678" maxLength={20} keyboardType="phone-pad" />
      </View>
      <PlayerChangeFields role={role} onRole={setRole} locked={locked} reason={reason} onReason={setReason} />
      <Text variant="caption" muted>
        {note}
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <Button label="Add to squad" loading={adding} onPress={() => onAdd({ name, phone, role }, reason)} />
    </>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
});
