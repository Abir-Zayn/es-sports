import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { radius, shadows, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { teamCodes } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerNotice, ScorerRoleLabel, ScorerSection } from './scorer-ui';

export function PlayingXiEditor({ setup, onChange }: { setup: MatchSetup; onChange: (setup: MatchSetup) => void }) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const size = setup.playersPerSide;
  const [editing, setEditing] = useState<TeamCode | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const open = (team: TeamCode) => { setSelected(setup.playingXi[team]); setEditing(team); };
  const toggle = (id: string) => setSelected((ids) => ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id]);
  return <ScorerSection title={t('scoring.xi.title')}>
    <View style={s.card}>
      {teamCodes.map((code) => <View key={code} style={s.row}>
        <InitialsAvatar label={setup.teams[code].team.short} tone={setup.teams[code].team.tone} imageUri={setup.teams[code].team.avatarUri} size={sizes.avatar} />
        <View style={s.text}><Text style={s.name}>{setup.teams[code].team.name}</Text>
          <Text style={s.confirmed}>{t('scoring.xi.confirmed', { count: setup.playingXi[code].length })}</Text></View>
        <Button label={t('common.edit')} size="compact" variant="ghost" accessibilityLabel={t('scoring.xi.editA11y', { team: setup.teams[code].team.name })} onPress={() => open(code)} />
      </View>)}
    </View>
    <ScorerSheet visible={editing !== null} title={t('scoring.xi.sheetTitle', { selected: selected.length, size })} onClose={() => setEditing(null)}>
      <ScorerNotice>{t('scoring.xi.sheetNotice', { size })}</ScorerNotice>
      {editing ? setup.teams[editing].players.map((p) => <ScorerChoice key={p.id} label={p.name} detail={ScorerRoleLabel(p.role, t)}
        selected={selected.includes(p.id)} disabled={!selected.includes(p.id) && selected.length >= size} onPress={() => toggle(p.id)} />) : null}
      <Button label={t('scoring.xi.confirm')} disabled={selected.length !== size} onPress={() => {
        if (editing) onChange({ ...setup, playingXi: { ...setup.playingXi, [editing]: selected } });
        setEditing(null);
      }} />
    </ScorerSheet>
  </ScorerSection>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card, paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: sizes.cardPaddingTight },
  text: { flex: 1, minWidth: 0, gap: spacing.xs }, name: typography.labelMd,
  confirmed: { ...typography.bodySm, color: c.link },
});
