import ChevronRight from 'lucide-react-native/icons/chevron-right';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppBadge, Button, InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamCodes } from '../sample-data';
import type { MatchSetup, TeamCode } from '../types';
import { ScorerSheet } from './scorer-sheet';
import { ScorerChoice, ScorerNotice, ScorerRoleLabel } from './scorer-ui';

export function PlayingXiEditor({ setup, onChange }: { setup: MatchSetup; onChange: (setup: MatchSetup) => void }) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const size = setup.playersPerSide;
  const [editing, setEditing] = useState<TeamCode | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const open = (team: TeamCode) => { setSelected(setup.playingXi[team]); setEditing(team); };
  const toggle = (id: string) => setSelected((ids) => ids.includes(id) ? ids.filter((p) => p !== id) : [...ids, id]);
  return <View>
    <View style={s.card}>
      {teamCodes.map((code, i) => {
        const count = setup.playingXi[code].length;
        const ready = count === size;
        return <Pressable key={code} accessibilityRole="button" accessibilityLabel={t('scoring.xi.editA11y', { team: setup.teams[code].team.name })}
          accessibilityHint={t('scoring.xi.countA11y', { count, size })} onPress={() => open(code)}
          style={({ pressed }) => [s.row, i === 0 && s.divider, pressed && s.pressed]}>
          <InitialsAvatar label={setup.teams[code].team.short} tone={setup.teams[code].team.tone} imageUri={setup.teams[code].team.avatarUri} size={sizes.avatar} />
          <View style={s.text}><Text style={s.name} numberOfLines={1}>{setup.teams[code].team.name}</Text>
            <Text style={s.count}>{t('scoring.xi.count', { count, size })}</Text></View>
          <AppBadge label={ready ? t('scoring.xi.ready') : t('scoring.xi.pickMore', { count: size - count })}
            backgroundColor={ready ? colors.successSoft : colors.accentSoft} color={ready ? colors.success : colors.accent} />
          <ChevronRight size={sizes.iconSmall} color={colors.textMuted} />
        </Pressable>;
      })}
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
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  card: { borderRadius: radius.lg, backgroundColor: c.surface, ...shadows.card, paddingHorizontal: sizes.cardPaddingTight },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, minHeight: dp(64), paddingVertical: spacing.md },
  divider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border },
  pressed: { opacity: 0.6 },
  text: { flex: 1, minWidth: 0, gap: dp(2) }, name: typography.labelMd,
  count: { ...typography.bodySm, color: c.textMuted },
});
