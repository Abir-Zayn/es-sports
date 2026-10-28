import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Text } from '@/components/ui';
import { useThemedStyles, type Palette } from '@/theme';

import { ScorerFrame, ScorerNotice } from './components/scorer-ui';
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
    <View style={[s.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]} accessibilityViewIsModal>
      <View style={s.handle} />
      <ScrollView contentContainerStyle={s.content}>
        <View style={s.heading}><View style={s.badge}><Text style={s.runs}>{pendingShot.runs}</Text></View>
          <View style={s.title}><Text variant="heading">Where did the ball go?</Text><Text muted style={s.caption}>{pendingShot.batter} · {pendingShot.ball}</Text></View></View>
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
  sheet: { maxHeight: '90%', backgroundColor: c.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, borderWidth: 1, borderColor: c.border, paddingHorizontal: 20, paddingTop: 12 },
  handle: { height: 4, width: 44, alignSelf: 'center', borderRadius: 2, backgroundColor: c.outline, marginBottom: 18 },
  content: { gap: 14, paddingBottom: 4 }, heading: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: c.primary },
  runs: { color: c.primaryText, fontSize: 24, lineHeight: 30, fontWeight: '800' }, title: { flex: 1, gap: 2 }, caption: { fontSize: 12, lineHeight: 17 },
  direction: { fontSize: 14, lineHeight: 19, textAlign: 'center' }, selected: { color: c.link, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10 }, skip: { flex: 1 }, save: { flex: 2 },
});
