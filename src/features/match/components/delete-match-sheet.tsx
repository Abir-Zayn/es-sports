import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { useTranslation } from '@/i18n';
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
  const { t } = useTranslation();
  return <Sheet visible={visible} title={t('friendly.delete.title')} onClose={onClose}>
    {/* Mounted only while open, so a reopened sheet starts with an empty box. */}
    {visible ? <DeleteBody {...body} onClose={onClose} /> : null}
  </Sheet>;
}

function DeleteBody({ label, busy, error, onConfirm, onClose }: Omit<Props, 'visible'>) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const [typed, setTyped] = useState('');
  const ready = isDeleteConfirmed(typed);
  return <View style={s.body}>
    <Text>{t('friendly.delete.warning', { label })}</Text>
    <TextField label={t('friendly.delete.confirmLabel', { word: deleteConfirmWord })} value={typed} onChangeText={setTyped}
      autoCapitalize="characters" autoCorrect={false} editable={!busy} />
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
    <Button label={t('friendly.delete.confirmButton')} disabled={!ready || busy} loading={busy} onPress={onConfirm} />
    <Button label={t('friendly.delete.keepButton')} variant="secondary" disabled={busy} onPress={onClose} />
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  body: { gap: spacing.md },
  error: { color: c.danger },
});
