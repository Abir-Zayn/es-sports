import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { quadrantAngle } from '@/lib/pitch-quadrant';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

import { ScorerFrame, ScorerNotice } from './components/scorer-ui';
import { PitchQuadrantBar } from './components/pitch-quadrant-bar';
import { directionLabel, ShotField } from './components/shot-field';
import { localEventId, useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

export function ShotDirectionScreen() {
  const { pendingShot, score, dispatch } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const insets = useSafeAreaInsets();
  const { t, locale } = useTranslation();
  const [angle, setAngle] = useState(-15);
  if (!pendingShot || !score) return <ScorerFrame><ScorerNotice>{t('scoring.shot.noneWaiting')}</ScorerNotice>
    <Button label={t('scoring.wicket.backToScoring')} onPress={() => routes.replace('pad')} /></ScorerFrame>;
  const finish = (direction?: number) => {
    dispatch({ type: 'shot', angle: direction, id: localEventId() });
    if (score.awaitingBowler) routes.replace('over'); else routes.back();
  };
  return <View style={s.overlay}>
    <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, sizes.cardPaddingTight) }]} accessibilityViewIsModal>
      <View style={s.handle} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heading}><View style={s.badge}><Text style={s.runs}>{pendingShot.runs}</Text></View>
          <View style={s.title}><Text variant="heading">{t('scoring.shot.whereTitle')}</Text><Text muted style={s.caption}>{t('scoring.shot.subtitle', { batter: pendingShot.batter, ball: pendingShot.ball })}</Text></View></View>
        <Text muted style={s.caption}>{t('scoring.shot.hint')}</Text>
        <PitchQuadrantBar angle={null} onPick={(zone) => finish(quadrantAngle(zone))} />
        <ShotField runs={pendingShot.runs} angle={angle} onChange={setAngle} />
        <Text muted style={s.direction}>{t('scoring.shot.directionPrefix')} <Text style={s.selected}>{directionLabel(angle, locale)}</Text></Text>
        <View style={s.actions}><View style={s.skip}><Button label={t('scoring.shot.skip')} variant="secondary" onPress={() => finish()} /></View>
          <View style={s.save}><Button label={t('scoring.shot.save')} onPress={() => finish(angle)} /></View></View>
        <ScorerNotice>{t('scoring.shot.notice')}</ScorerNotice>
      </ScrollView>
    </View>
  </View>;
}
const styles = (c: Palette) => StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: c.overlay },
  sheet: { maxHeight: '90%', backgroundColor: c.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: sizes.gutter, paddingTop: spacing.md },
  handle: { height: dp(4), width: dp(44), alignSelf: 'center', borderRadius: radius.pill, backgroundColor: c.outline, marginBottom: spacing.lg },
  content: { gap: spacing.lg, paddingBottom: spacing.xs }, heading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  badge: { width: dp(48), height: dp(48), borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primarySoft },
  runs: { ...typography.headlineLg, color: c.link, fontVariant: ['tabular-nums'] }, title: { flex: 1, gap: spacing.xs / 2 }, caption: typography.bodySm,
  direction: { ...typography.bodyMd, textAlign: 'center' }, selected: { color: c.link },
  actions: { flexDirection: 'row', gap: spacing.md }, skip: { flex: 1 }, save: { flex: 2 },
});
