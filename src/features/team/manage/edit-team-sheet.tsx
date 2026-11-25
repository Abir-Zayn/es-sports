import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppTabs, Button, Text, TextField } from '@/components/ui';
import { Sheet } from '@/features/tournament/roster';
import { spacing, useThemedStyles, type AvatarTone, type Palette } from '@/theme';

import { cleanShortName, teamProblem, type NewTeamInput } from '../data/team-rules';
import type { TeamRecord } from '../data/team-repository';

const toneTabs: { id: AvatarTone; label: string }[] = [{ id: 'blue', label: 'Blue' }, { id: 'yellow', label: 'Yellow' }, { id: 'neutral', label: 'Grey' }];

type Props = { team: TeamRecord | null; busy: boolean; error: string | null; onSave: (input: NewTeamInput) => void; onClose: () => void };

/** The owner's (or an admin's) edit of the team's name, short name, colour and area, checked before it is sent. */
export function EditTeamSheet({ team, busy, error, onSave, onClose }: Props) {
  return (
    <Sheet visible={team !== null} title="Edit team" onClose={onClose}>
      {team ? <EditBody key={team.id} team={team} busy={busy} error={error} onSave={onSave} /> : null}
    </Sheet>
  );
}

function EditBody({ team, busy, error, onSave }: Omit<Props, 'onClose' | 'team'> & { team: TeamRecord }) {
  const s = useThemedStyles(styles);
  const [input, setInput] = useState<NewTeamInput>({ name: team.name, shortName: team.shortName, tone: team.tone, area: team.area ?? '' });
  const [problem, setProblem] = useState<string | null>(null);
  const change = (patch: Partial<NewTeamInput>) => { setInput((current) => ({ ...current, ...patch })); setProblem(null); };
  const unchanged = input.name.trim() === team.name && input.shortName === team.shortName && input.tone === team.tone
    && input.area.trim() === (team.area ?? '');
  const save = () => {
    const found = teamProblem(input);
    setProblem(found);
    if (!found) onSave(input);
  };
  const shown = problem ?? error;
  return (
    <View style={s.body}>
      <TextField label="Team name" value={input.name} onChangeText={(name) => change({ name })} maxLength={40} autoCapitalize="words" />
      <TextField label="Short name" value={input.shortName} onChangeText={(value) => change({ shortName: cleanShortName(value) })}
        maxLength={4} autoCapitalize="characters" />
      <View style={s.group}>
        <Text variant="caption" muted>Team colour</Text>
        <AppTabs tabs={toneTabs} selected={input.tone} onSelect={(tone) => change({ tone })} />
      </View>
      <TextField label="Area (optional)" value={input.area} onChangeText={(area) => change({ area })} maxLength={60} />
      {shown ? <Text accessibilityRole="alert" style={s.error}>{shown}</Text> : null}
      <Button label="Save changes" loading={busy} disabled={unchanged} onPress={save} />
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  body: { gap: spacing.lg, paddingBottom: spacing.lg },
  group: { gap: spacing.sm },
  error: { color: c.dangerSoftText },
});
