import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { scorerTeams } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerNotice, ScorerSection } from './scorer-ui';

export function PlayingXiEditor({ setup, onChange }: { setup: MatchSetup; onChange: (setup: MatchSetup) => void }) {
  const s = useThemedStyles(styles);
  const [editing, setEditing] = useState<TeamCode | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const open = (team: TeamCode) => { setSelected(setup.playingXi[team]); setEditing(team); };
  const toggle = (id: string) => setSelected((ids) => ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id]);
  return <ScorerSection title="Playing XI">
    <View style={s.card}>
      {(['KK', 'CS'] as const).map((code) => <View key={code} style={s.row}>
        <InitialsAvatar label={code} tone={scorerTeams[code].team.tone} size={40} />
        <View style={s.text}><Text style={s.name}>{scorerTeams[code].team.name}</Text>
          <Text style={s.confirmed}>{setup.playingXi[code].length} selected · confirmed</Text></View>
        <Button label="Edit" size="compact" variant="ghost" accessibilityLabel={`Edit ${scorerTeams[code].team.name} playing XI`} onPress={() => open(code)} />
      </View>)}
    </View>
    <ScorerSheet visible={editing !== null} title={`Playing XI · ${selected.length}/11`} onClose={() => setEditing(null)}>
      <ScorerNotice>Choose eleven players. Reserve players can replace a selected player.</ScorerNotice>
      {editing ? scorerTeams[editing].players.map((p) => <ScorerChoice key={p.id} label={p.name} detail={p.role}
        selected={selected.includes(p.id)} disabled={!selected.includes(p.id) && selected.length >= 11} onPress={() => toggle(p.id)} />) : null}
      <Button label="Confirm playing XI" disabled={selected.length !== 11} onPress={() => {
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
