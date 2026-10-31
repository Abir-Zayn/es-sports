import { useRouter } from 'expo-router';
import X from 'lucide-react-native/icons/x';
import { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppIconTile, Button, Text } from '@/components/ui';
import { createFriendlyMatch, FriendlySetupExpiredError } from '@/features/scoring/data/friendly-create';
import { buildMatchRows, FRIENDLY_REF_PREFIX } from '@/features/scoring/data/match-rows';
import { localEventId } from '@/features/scoring/local-id';
import { useMe } from '@/features/tournament/roster';
import { appLink, shareText } from '@/lib/share';
import { radius, sizes, spacing, useThemedStyles, type Palette } from '@/theme';

import { FriendlyFormatCard, ScorerAssignmentRow } from './components/friendly-setup-form';
import { FriendlySheets, type FriendlySheet } from './components/friendly-sheets';
import { FriendlyTeamCard } from './components/friendly-team-card';
import { SavedFriendlies } from './components/saved-friendlies';
import { TossCoinModal } from './components/toss-coin-modal';
import {
  addPlayer, friendlyProblems, newFriendly, removePlayer, renameTeam, sides, togglePlaying, withPlayersPerSide,
} from './friendly/friendly-rules';
import { teamLabel } from './friendly/toss';
import { sweepOrphanTeamImagesDaily } from './friendly/team-image-sweep';
import { uploadTeamImage } from './friendly/team-images';
import { toScorerSetup } from './friendly/to-scorer-setup';
import type { FriendlyMatchSetup, FriendlySide, FriendlyTossResult } from './types';

const errorText = (error: unknown) => (error instanceof Error ? error.message : 'Something went wrong. Try again.');

/** Two teams, a format and a scorer on one screen, then the toss and straight into scoring. */
export function FriendlySetupScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const s = useThemedStyles(styles);
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
  function open(next: FriendlySheet) {
    setSheetError(null);
    setSheet(next);
  }
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
        if (squad.imageUri) {
          const imageUri = await uploadTeamImage(me.id, matchId.current, side === 'teamA' ? 'a' : 'b', squad.imageUri, squad.imageMimeType);
          ready[side] = { ...squad, imageUri };
        }
      }
      const rows = buildMatchRows(matchId.current, tossed.id, toScorerSetup(ready, me.id), new Date());
      await createFriendlyMatch({ ...rows.match, status: 'scheduled', started_at: null }, rows.players, rows.scorers);
      if (!mounted.current) return;
      setTossing(false);
      if (scorer) {
        void shareText(`${me.name || 'Your teammate'} made you the scorer for ${teamLabel(tossed, 'teamA')} vs ${teamLabel(tossed, 'teamB')} on esSports: ${appLink(`scorer/${matchId.current}`)}`);
      }
      router.replace({ pathname: scorer ? '/match/[id]' : '/scorer/[id]', params: { id: matchId.current } });
    } catch (error) {
      // The old id can never be saved now; the next tap uploads the images again under a new one.
      const expired = error instanceof FriendlySetupExpiredError;
      if (expired) matchId.current = localEventId();
      if (mounted.current) {
        setSaveError(expired ? 'This setup was paused too long to save. Tap start again.'
          : 'Could not save this match or its images. Check your connection and image size, then try again.');
      }
    } finally {
      saveLock.current = false;
      if (mounted.current) setSaving(false);
    }
  }

  return <View style={[s.screen, { paddingTop: insets.top }]}>
    <View style={s.header}>
      <View style={s.titles}>
        <Text accessibilityRole="header" style={s.title}>Friendly Match Setup</Text>
        <Text muted style={s.step}>Step 1 of 2 · Teams & format, then the toss</Text>
      </View>
      <AppIconTile icon={X} size={44} borderRadius={radius.pill} accessibilityLabel="Close friendly match setup" onPress={close} />
    </View>
    <View style={s.progress}><View style={[s.bar, s.barOn]} /><View style={s.bar} /></View>
    <ScrollView contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 120 }]} keyboardShouldPersistTaps="handled">
      <SavedFriendlies userId={me.id} />
      <FriendlyFormatCard overs={setup.overs} playersPerSide={setup.playersPerSide} error={shown.format}
        onOvers={(overs) => setSetup({ ...setup, overs })} onPlayersPerSide={(n) => setSetup(withPlayersPerSide(setup, n))} />
      {sides.map((side: FriendlySide) => <FriendlyTeamCard key={side} label={side === 'teamA' ? 'Team A' : 'Team B'}
        squad={setup[side]} playersPerSide={setup.playersPerSide} error={notice?.side === side ? notice.message : shown[side]}
        onRename={(name) => setSetup(renameTeam(setup, side, name))}
        onImage={(imageUri, imageMimeType) => setSetup((current) => ({ ...current, [side]: { ...current[side], imageUri, imageMimeType } }))}
        onTogglePlaying={(p) => {
          try { setSetup(togglePlaying(setup, side, p.id)); setNotice(null); } catch (error) { setNotice({ side, message: errorText(error) }); }
        }}
        onRemove={(p) => setSetup(removePlayer(setup, side, p.id))}
        onFind={() => open({ kind: 'find', side })} onQuickAdd={() => open({ kind: 'guest', side })}
        onAddMe={me.id && !inSquad(me.id) ? () => change((c) => addPlayer(c, side, { id: localEventId(), name: me.name || 'Me', role: 'All-rounder', userId: me.id, avatarUrl: me.avatarUrl })) : undefined} />)}
      <ScorerAssignmentRow name={scorer ? scorer.name : 'You'} error={shown.scorer}
        detail={scorer ? 'Only this person can enter scores. They will receive a link.' : 'Only you enter scores. Pick an app user in a squad to hand it over.'}
        onPress={() => open({ kind: 'scorer' })} />
      {attempted && Object.keys(problems).length > 0 ? <Text style={s.error} accessibilityLiveRegion="polite">Fix the highlighted parts to go to the toss.</Text> : null}
    </ScrollView>
    <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <Button label="Proceed to Toss" onPress={() => { setAttempted(true); if (Object.keys(problems).length === 0) setTossing(true); }} />
    </View>
    <FriendlySheets sheet={sheet} error={sheetError} meId={me.id} setup={setup} onClose={() => setSheet(null)}
      onAddMember={(side, user, role) => { if (change((c) => addPlayer(c, side, { id: localEventId(), name: user.name, role, userId: user.id, avatarUrl: user.avatarUrl }))) setSheet(null); }}
      onAddGuest={(side, input) => { if (change((c) => addPlayer(c, side, { id: localEventId(), ...input }))) setSheet(null); }}
      onPickScorer={(id) => { setSetup({ ...setup, assignedScorerId: id === me.id ? '' : id }); setSheet(null); }} />
    <TossCoinModal visible={tossing} names={{ teamA: teamLabel(setup, 'teamA'), teamB: teamLabel(setup, 'teamB') }}
      saving={saving} error={saveError} onClose={closeToss}
      onStart={(toss) => void start(toss)} />
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: sizes.gutter, paddingVertical: spacing.md },
  titles: { flex: 1, gap: 2 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  step: { fontSize: 12, lineHeight: 17 },
  progress: { flexDirection: 'row', gap: 6, paddingHorizontal: sizes.gutter },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.border },
  barOn: { backgroundColor: c.primary },
  content: { padding: sizes.gutter, gap: spacing.lg },
  error: { fontSize: 13, lineHeight: 18, color: c.danger },
  footer: { paddingHorizontal: sizes.gutter, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.border, backgroundColor: c.background },
});
