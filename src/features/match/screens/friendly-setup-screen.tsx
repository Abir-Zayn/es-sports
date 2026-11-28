import { useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { createFriendlyMatch, FriendlySetupExpiredError } from '@/features/scoring/data/friendly-create';
import { buildMatchRows, FRIENDLY_REF_PREFIX } from '@/features/scoring/data/match-rows';
import { localEventId } from '@/features/scoring/local-id';
import { errorCode, teamErrorText } from '@/features/team/data/team-errors';
import { useMe } from '@/features/tournament/roster';
import { t as tGlobal, useTranslation } from '@/i18n';
import { appLink, shareText } from '@/lib/share';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { FriendlyFormatCard, ScorerAssignmentRow } from '../components/friendly-setup-form';
import { FriendlyMatchupHero } from '../components/friendly-matchup-hero';
import { ExistingTeamSheet } from '../components/existing-team-sheet';
import { FriendlySheets, type FriendlySheet } from '../components/friendly-sheets';
import { FriendlySideActionsSheet } from '../components/friendly-side-actions-sheet';
import { FriendlySquadSheet } from '../components/friendly-squad-sheet';
import { SavedFriendlies } from '../components/saved-friendlies';
import { TossCoinModal } from '../components/toss-coin-modal';
import {
  addPlayer, friendlyProblems, newFriendly, removePlayer, renameTeam, sides, togglePlaying, withPlayersPerSide,
} from '../utils/friendly-rules';
import { teamLabel } from '../utils/toss';
import { sweepOrphanTeamImagesDaily } from '../server/team-image-sweep';
import { uploadTeamImage } from '../server/team-images';
import { squadFromTeam, withTeam } from '../utils/existing-team';
import { toScorerSetup } from '../utils/to-scorer-setup';
import type { FriendlyMatchSetup, FriendlySide, FriendlyTossResult } from '../types';

const errorText = (error: unknown) => (error instanceof Error ? error.message : tGlobal('friendly.fallbackError'));

/** Two teams, a format and a scorer on one screen, then the toss and straight into scoring. */
export function FriendlySetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const me = useMe();
  const [setup, setSetup] = useState<FriendlyMatchSetup>(() => newFriendly(`${FRIENDLY_REF_PREFIX}${localEventId()}`, me.id, new Date()));
  const [sheet, setSheet] = useState<FriendlySheet>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [tossing, setTossing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveLock = useRef(false);
  const mounted = useRef(true);
  const matchId = useRef(localEventId());
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { if (me.id) void sweepOrphanTeamImagesDaily(me.id); }, [me.id]);
  const [attempted, setAttempted] = useState(false);
  const [notice, setNotice] = useState<{ side: FriendlySide; message: string } | null>(null);
  const [teamFor, setTeamFor] = useState<FriendlySide | null>(null);
  const [actionsFor, setActionsFor] = useState<FriendlySide | null>(null);
  const [squadFor, setSquadFor] = useState<FriendlySide | null>(null);
  const problems = friendlyProblems(setup, me.id);
  const shown = attempted ? problems : {};
  const inSquad = (userId: string) => sides.some((side) => setup[side].players.some((p) => p.userId === userId));
  const scorerId = setup.assignedScorerId || me.id;
  const scorer = scorerId === me.id ? null : [...setup.teamA.players, ...setup.teamB.players].find((p) => p.userId === scorerId);

  /** Applies a change; a refused change shows its reason in the open sheet and keeps the sheet open. */
  function change(update: (current: FriendlyMatchSetup) => FriendlyMatchSetup): boolean {
    try {
      setSetup(update(setup));
      setSheetError(null);
      return true;
    } catch (error) {
      setSheetError(errorText(error));
      return false;
    }
  }
  const open = (next: FriendlySheet) => { setSheetError(null); setSheet(next); };
  const sideError = (side: FriendlySide) => (notice?.side === side ? notice.message : shown[side]);
  const unlink = (side: FriendlySide) => setSetup((c) => ({ ...c, [side]: { ...c[side], teamId: undefined } }));
  const addMe = (side: FriendlySide) => (me.id && !inSquad(me.id) // Offered only while the creator is in neither squad.
    ? () => change((c) => addPlayer(c, side, { id: localEventId(), name: me.name || t('friendly.me'), role: 'All-rounder', userId: me.id, avatarUrl: me.avatarUrl })) : undefined);
  const close = () => router.canGoBack() ? router.back() : router.replace('/matches');
  /** Leaving the toss starts a new match id. Images of an unsaved one are left to the daily sweep. */
  function closeToss() {
    if (saving) return;
    setTossing(false);
    setSaveError(null);
    matchId.current = localEventId();
  }

  async function start(toss: FriendlyTossResult) {
    if (saveLock.current) return;
    saveLock.current = true;
    setSaving(true);
    setSaveError(null);
    const tossed: FriendlyMatchSetup = { ...setup, toss, status: 'tossed' };
    try {
      const ready = { ...tossed };
      for (const side of sides) {
        const squad = ready[side];
        // A linked team's logo is already online; only a picked photo is uploaded.
        if (squad.imageUri && !squad.imageUri.startsWith('https://')) {
          const imageUri = await uploadTeamImage(me.id, matchId.current, side === 'teamA' ? 'a' : 'b', squad.imageUri, squad.imageMimeType);
          ready[side] = { ...squad, imageUri };
        }
      }
      const rows = buildMatchRows(matchId.current, tossed.id, toScorerSetup(ready, me.id), new Date());
      await createFriendlyMatch({ ...rows.match, status: 'scheduled', started_at: null, team_a_id: ready.teamA.teamId ?? null, team_b_id: ready.teamB.teamId ?? null },
        rows.players, rows.scorers);
      if (!mounted.current) return;
      setTossing(false);
      if (scorer) {
        void shareText(t('friendly.shareScorerInvite', {
          name: me.name || t('friendly.teammateFallback'),
          teamA: teamLabel(tossed, 'teamA'),
          teamB: teamLabel(tossed, 'teamB'),
          link: appLink(`scorer/${matchId.current}`),
        }));
      }
      router.replace({ pathname: scorer ? '/match/[id]' : '/scorer/[id]', params: { id: matchId.current } });
    } catch (error) {
      // The old id can never be saved now; the next tap uploads the images again under a new one.
      const expired = error instanceof FriendlySetupExpiredError;
      if (expired) matchId.current = localEventId();
      if (mounted.current) {
        // A linked team that became busy (or a draft) is refused with its reason; say that rather than a generic failure.
        const busyTeam = errorCode(error) === 'ET023';
        setSaveError(expired ? t('friendly.saveExpiredError') : busyTeam ? teamErrorText(error) : t('friendly.saveFailedError'));
      }
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return <View style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}>
      <View style={s.titles}>
        <Text accessibilityRole="header" style={s.title}>{t('friendly.title')}</Text>
        <Text muted style={s.step}>{t('friendly.step')}</Text>
      </View>
      <AppIconTile icon={X} size={sizes.iconButton} borderRadius={radius.pill} accessibilityLabel={t('friendly.closeA11y')} onPress={close} />
    </View>
    <View style={s.progress}><View style={[s.bar, s.barOn]} /><View style={s.bar} /></View>
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + dp(120) }]} keyboardShouldPersistTaps="handled">
      <SavedFriendlies userId={me.id} />
      <FriendlyMatchupHero teamA={setup.teamA} teamB={setup.teamB} nameA={teamLabel(setup, 'teamA')} nameB={teamLabel(setup, 'teamB')}
        overs={setup.overs} playersPerSide={setup.playersPerSide}
        onImage={(side, imageUri, imageMimeType) => setSetup((current) => ({ ...current, [side]: { ...current[side], imageUri, imageMimeType } }))}
        onRename={(side, name) => setSetup(renameTeam(setup, side, name))} onMore={setActionsFor}
        errors={Object.fromEntries(sides.filter((side) => side !== squadFor).map((side) => [side, sideError(side)]))} />
      <Text accessibilityRole="header" muted style={s.section}>{t('friendly.sectionFormat')}</Text>
      <FriendlyFormatCard overs={setup.overs} playersPerSide={setup.playersPerSide} error={shown.format}
        onOvers={(overs) => setSetup({ ...setup, overs })} onPlayersPerSide={(n) => setSetup(withPlayersPerSide(setup, n))} />
      <Text accessibilityRole="header" muted style={s.section}>{t('friendly.sectionScorer')}</Text>
      <ScorerAssignmentRow name={scorer ? scorer.name : t('friendly.you')} avatarUrl={scorer ? scorer.avatarUrl : me.avatarUrl} error={shown.scorer}
        detail={scorer ? t('friendly.scorerAssignedDetail') : t('friendly.scorerSelfDetail')}
        onPress={() => open({ kind: 'scorer' })} />
      {attempted && Object.keys(problems).length > 0 ? <Text style={s.error} accessibilityLiveRegion="polite">{t('friendly.fixProblems')}</Text> : null}
    </ScrollView>
    <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Button label={t('friendly.proceedToToss')} onPress={() => { setAttempted(true); if (Object.keys(problems).length === 0) setTossing(true); }} />
    </View>
    <FriendlySheets sheet={sheet} error={sheetError} meId={me.id} setup={setup} onClose={() => setSheet(null)}
      onAddMember={(side, user, role) => { if (change((c) => addPlayer(c, side, { id: localEventId(), name: user.name, role, userId: user.id, avatarUrl: user.avatarUrl }))) setSheet(null); }}
      onAddGuest={(side, input) => { if (change((c) => addPlayer(c, side, { id: localEventId(), ...input }))) setSheet(null); }}
      onPickScorer={(id) => { setSetup({ ...setup, assignedScorerId: id === me.id ? '' : id }); setSheet(null); }} />
    <FriendlySideActionsSheet side={actionsFor} setup={setup} onClose={() => setActionsFor(null)} onSearchTeams={setTeamFor} onUnlink={unlink}
      onFind={(side) => open({ kind: 'find', side })} onQuickAdd={(side) => open({ kind: 'guest', side })} addMe={addMe} onSquad={setSquadFor} />
    {squadFor ? <FriendlySquadSheet visible title={t('friendly.team.squadTitle', { title: teamLabel(setup, squadFor) })} squad={setup[squadFor]}
      playersPerSide={setup.playersPerSide} error={sideError(squadFor)} onClose={() => setSquadFor(null)}
      onTogglePlaying={(p) => { try { setSetup(togglePlaying(setup, squadFor, p.id)); setNotice(null); } catch (error) { setNotice({ side: squadFor, message: errorText(error) }); } }}
      onRemove={(p) => setSetup(removePlayer(setup, squadFor, p.id))} /> : null}
    <ExistingTeamSheet visible={teamFor !== null} meId={me.id} otherTeamId={teamFor ? setup[teamFor === 'teamA' ? 'teamB' : 'teamA'].teamId : undefined}
      onClose={() => setTeamFor(null)}
      onPick={(team, members) => { if (teamFor) setSetup((c) => withTeam(c, teamFor, squadFromTeam(team, members, c.playersPerSide, localEventId))); setTeamFor(null); }} />
    <TossCoinModal visible={tossing} names={{ teamA: teamLabel(setup, 'teamA'), teamB: teamLabel(setup, 'teamB') }}
      saving={saving} error={saveError} onClose={closeToss}
      onStart={(toss) => void start(toss)} />
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingTop: spacing.md, paddingBottom: spacing.lg },
  titles: { flex: 1, gap: dp(2) },
  title: typography.displayMd,
  step: typography.bodySm,
  progress: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: sizes.gutter },
  bar: { flex: 1, height: dp(6), borderRadius: radius.pill, backgroundColor: c.border },
  barOn: { backgroundColor: c.primary },
  content: { padding: sizes.gutter, gap: sizes.sectionGap },
  section: { ...typography.labelUppercase, marginTop: spacing.sm, marginBottom: -spacing.md },
  error: { ...typography.bodySm, color: c.danger },
  footer: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
});
