import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
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
  const [angle, setAngle] = useState(-15);
  if (!pendingShot || !score) return <ScorerFrame><ScorerNotice>No shot is waiting for a direction.</ScorerNotice>
    <Button label="Back to scoring" onPress={() => routes.replace('pad')} /></ScorerFrame>;
  const finish = (direction?: number) => {
    dispatch({ type: 'shot', angle: direction, id: localEventId() });
    if (score.awaitingBowler) routes.replace('over'); else routes.back();
  };
  return <View style={s.overlay}>
    <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, sizes.cardPaddingTight) }]} accessibilityViewIsModal>
      <View style={s.handle} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heading}><View style={s.badge}><Text style={s.runs}>{pendingShot.runs}</Text></View>
          <View style={s.title}><Text variant="heading">Where did the ball go?</Text><Text muted style={s.caption}>{pendingShot.batter} · {pendingShot.ball}</Text></View></View>
        <Text muted style={s.caption}>One tap saves the zone. Or place it on the field and save.</Text>
        <PitchQuadrantBar angle={null} onPick={(zone) => finish(quadrantAngle(zone))} />
        <ShotField runs={pendingShot.runs} angle={angle} onChange={setAngle} />
        <Text muted style={s.direction}>Direction <Text style={s.selected}>{directionLabel(angle)}</Text></Text>
        <View style={s.actions}><View style={s.skip}><Button label="Skip" variant="secondary" onPress={() => finish()} /></View>
          <View style={s.save}><Button label="Save shot" onPress={() => finish(angle)} /></View></View>
        <ScorerNotice>Shown only for runs off the bat. 4s and 6s snap to the boundary.</ScorerNotice>
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
