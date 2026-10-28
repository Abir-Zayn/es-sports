import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text, TextField } from '@/components/ui';
import { spacing, useTheme } from '@/theme';

import { suggestShortName } from '../permissions';
import type { NewTeam } from '../types';
import { Sheet } from './sheet';

type Props = {
  visible: boolean;
  creating: boolean;
  /** Why the last attempt was refused, from the same rules the server applies. */
  error: string | null;
  onCreate: (team: NewTeam) => void;
  onClose: () => void;
};

/** Names a new team. The short name follows the name until it is edited by hand. */
export function CreateTeamSheet({ visible, onClose, ...form }: Props) {
  return (
    <Sheet visible={visible} title="Create team" onClose={onClose}>
      {/* Mounted only while open, so every opening starts with empty fields. */}
      {visible ? <CreateTeamForm {...form} /> : null}
    </Sheet>
  );
}

function CreateTeamForm({ creating, error, onCreate }: Omit<Props, 'visible' | 'onClose'>) {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [short, setShort] = useState('');
  const [shortEdited, setShortEdited] = useState(false);

  function changeName(value: string) {
    setName(value);
    if (!shortEdited) setShort(suggestShortName(value));
  }

  function changeShort(value: string) {
    setShortEdited(true);
    setShort(value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4));
  }

  return (
    <>
      <View style={styles.fields}>
        <TextField label="Team name" value={name} onChangeText={changeName} placeholder="e.g. Chattogram Strikers" maxLength={40} autoCapitalize="words" autoFocus />
        <TextField label="Short name" value={short} onChangeText={changeShort} placeholder="e.g. CS" maxLength={4} autoCapitalize="characters" />
      </View>
      <Text variant="caption" muted>
        You can invite the team owner next. They bring in the players.
      </Text>
      {error ? (
        <Text accessibilityRole="alert" style={{ color: colors.dangerSoftText }}>
          {error}
        </Text>
      ) : null}
      <Button label="Create team" loading={creating} onPress={() => onCreate({ name, short })} />
    </>
  );
}

const styles = StyleSheet.create({
  fields: { gap: spacing.md },
});
