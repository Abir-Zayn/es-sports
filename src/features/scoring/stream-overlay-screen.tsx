import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { OverlayPreview, type OverlayGraphic } from './components/overlay-preview';
import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { SwitchRow } from './components/switch-row';
import { useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

const graphics: OverlayGraphic[] = ['Lineup', 'Player card', 'Over summary', 'Points table'];

export function StreamOverlayScreen() {
  const { score, overlay, dispatch } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const [preview, setPreview] = useState<{ graphic: OverlayGraphic; key: number } | null>(null);
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => setPreview(null), 10_000);
    return () => clearTimeout(timer);
  }, [preview]);
  const update = (value: Partial<typeof overlay>) => dispatch({ type: 'overlay', value: { ...overlay, ...value } });
  if (!score) return <ScorerFrame><ScorerNotice>Start a scoring session to preview the overlay.</ScorerNotice>
    <Button label="Set up match" onPress={() => routes.replace('setup')} /></ScorerFrame>;
  return <ScorerFrame>
    <ScorerHeader title="Stream overlay" subtitle="Match 12 · Kings vs Strikers" onBack={routes.back}
      trailing={<View style={s.badge}><Text style={s.badgeText}>Streamer</Text></View>} />
    <OverlayPreview score={score} graphic={preview?.graphic ?? null} accent={overlay.color === 'blue' ? colors.primary : '#FFC83D'} />
    <ScorerSection title="Overlay link">
      <View style={s.linkRow}><View style={s.link}><Text muted style={s.caption}>Overlay not connected</Text></View><Button label="Copy" disabled /></View>
      <ScorerNotice>A hosted overlay service is needed to generate a browser-source link. This preview uses your local scoring session.</ScorerNotice>
    </ScorerSection>
    <ScorerSection title="Show on stream">
      <View style={s.graphics}>{graphics.map((graphic) => <Pressable key={graphic} accessibilityRole="button"
        accessibilityState={{ selected: preview?.graphic === graphic }} onPress={() => setPreview({ graphic, key: Date.now() })}
        style={({ pressed }) => [s.graphicButton, preview?.graphic === graphic && s.selected, pressed && s.pressed]}>
        <Text style={s.graphicLabel}>{graphic}</Text>
      </Pressable>)}</View>
      <ScorerNotice>Tap to preview a full-screen graphic for 10 seconds.</ScorerNotice>
    </ScorerSection>
    <View style={s.toggles}>
      <SwitchRow title="Boundary and wicket flash" detail="Big FOUR, SIX and WICKET animations" value={overlay.flashes} onChange={(flashes) => update({ flashes })} />
      <SwitchRow title="Milestones" detail="Fifties, hundreds and the result" value={overlay.milestones} onChange={(milestones) => update({ milestones })} />
    </View>
    <View style={s.colorRow}><Text muted style={s.caption}>Overlay colour</Text><View style={s.swatches}>
      {(['blue', 'yellow'] as const).map((color) => <Pressable key={color} accessibilityRole="radio"
        accessibilityLabel={`${color} overlay colour`} accessibilityState={{ checked: overlay.color === color }}
        onPress={() => update({ color })} style={s.swatchTarget}>
        <View style={[s.swatch, { backgroundColor: color === 'blue' ? colors.primary : '#FFC83D' }, overlay.color === color && s.swatchSelected]} />
      </Pressable>)}
    </View></View>
    <ScorerNotice>Overlay preferences are local to this session. Live publishing and automatic animations require the streaming service.</ScorerNotice>
  </ScorerFrame>;
}
const styles = (c: Palette) => StyleSheet.create({
  badge: { backgroundColor: c.primarySoft, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  badgeText: { ...typography.labelSm, color: c.link },
  caption: typography.bodyMd, linkRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  link: { flex: 1, minHeight: sizes.field, paddingHorizontal: sizes.cardPaddingTight, justifyContent: 'center', borderRadius: radius.md, backgroundColor: c.surfaceRaised },
  graphics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  graphicButton: { width: '48%', minHeight: sizes.control, borderRadius: radius.md, backgroundColor: c.surfaceRaised, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  graphicLabel: typography.labelMd, selected: { borderColor: c.primary, backgroundColor: c.primarySoft }, pressed: { transform: [{ scale: 0.95 }] },
  toggles: { gap: spacing.sm }, colorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  swatches: { flexDirection: 'row', gap: spacing.xs }, swatchTarget: { width: dp(48), height: dp(48), alignItems: 'center', justifyContent: 'center' },
  swatch: { width: dp(30), height: dp(30), borderRadius: radius.pill, borderWidth: 2, borderColor: c.background },
  swatchSelected: { borderColor: c.primary, borderWidth: 3 },
});
