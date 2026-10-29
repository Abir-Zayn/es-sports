import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { teamCodes } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerNotice, ScorerSection } from './scorer-ui';

export function PlayingXiEditor({ setup, onChange }: { setup: MatchSetup; onChange: (setup: MatchSetup) => void }) {
  const s = useThemedStyles(styles);
  const size = setup.playersPerSide;
  const [editing, setEditing] = useState<TeamCode | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const open = (team: TeamCode) => { setSelected(setup.playingXi[team]); setEditing(team); };
  const toggle = (id: string) => setSelected((ids) => ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id]);
  return <ScorerSection title="Playing XI">
    <View style={s.card}>
      {teamCodes.map((code) => <View key={code} style={s.row}>
        <InitialsAvatar label={setup.teams[code].team.short} tone={setup.teams[code].team.tone} size={40} />
        <View style={s.text}><Text style={s.name}>{setup.teams[code].team.name}</Text>
          <Text style={s.confirmed}>{setup.playingXi[code].length} selected · confirmed</Text></View>
        <Button label="Edit" size="compact" variant="ghost" accessibilityLabel={`Edit ${setup.teams[code].team.name} playing XI`} onPress={() => open(code)} />
      </View>)}
    </View>
    <ScorerSheet visible={editing !== null} title={`Playing side · ${selected.length}/${size}`} onClose={() => setEditing(null)}>
      <ScorerNotice>Choose {size} players. Reserve players can replace a selected player.</ScorerNotice>
      {editing ? setup.teams[editing].players.map((p) => <ScorerChoice key={p.id} label={p.name} detail={p.role}
        selected={selected.includes(p.id)} disabled={!selected.includes(p.id) && selected.length >= size} onPress={() => toggle(p.id)} />) : null}
      <Button label="Confirm playing side" disabled={selected.length !== size} onPress={() => {
        if (editing) onChange({ ...setup, playingXi: { ...setup.playingXi, [editing]: selected } });
        setEditing(null);
      }} />
    </ScorerSheet>
  </ScorerSection>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { borderRadius: 18, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  text: { flex: 1, minWidth: 0, gap: 3 }, name: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  confirmed: { color: c.link, fontSize: 12, lineHeight: 17 },
});
