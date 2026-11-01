import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { spacing, useThemedStyles, type Palette } from '@/theme';

import { deleteConfirmWord, isDeleteConfirmed } from '../friendly/delete-friendly';

type Props = {
  visible: boolean;
  /** The match being deleted, e.g. "Alpha vs Beta". */
  label: string;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onClose: () => void;
};

/** Asks the person to type DELETE before an unfinished match is removed from the phone and the database. */
export function DeleteMatchSheet({ visible, onClose, ...body }: Props) {
  return <Sheet visible={visible} title="Delete this match?" onClose={onClose}>
    {/* Mounted only while open, so a reopened sheet starts with an empty box. */}
    {visible ? <DeleteBody {...body} onClose={onClose} /> : null}
  </Sheet>;
}

function DeleteBody({ label, busy, error, onConfirm, onClose }: Omit<Props, 'visible'>) {
  const s = useThemedStyles(styles);
  const [typed, setTyped] = useState('');
  const ready = isDeleteConfirmed(typed);
  return <View style={s.body}>
    <Text>{`${label} will be deleted for good: its squads, scorer and every ball scored. This cannot be undone.`}</Text>
    <TextField label={`Type ${deleteConfirmWord} to confirm`} value={typed} onChangeText={setTyped}
      autoCapitalize="characters" autoCorrect={false} editable={!busy} />
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Button label="Delete match" disabled={!ready || busy} loading={busy} onPress={onConfirm} />
    <Button label="Keep match" variant="secondary" disabled={busy} onPress={onClose} />
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  body: { gap: spacing.md },
  error: { color: c.danger },
});
