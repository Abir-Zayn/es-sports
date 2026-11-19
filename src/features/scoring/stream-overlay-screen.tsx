import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { OverlayPreview, type OverlayGraphic } from './components/overlay-preview';
import { ScorerFrame, ScorerHeader, ScorerNotice, ScorerSection } from './components/scorer-ui';
import { SwitchRow } from './components/switch-row';
import { useScorer } from './scorer-provider';
import { useScorerRoutes } from './use-scorer-routes';

const graphics: OverlayGraphic[] = ['Lineup', 'Player card', 'Over summary', 'Points table'];

const GRAPHIC_KEYS: Record<OverlayGraphic, 'scoring.overlay.graphic.Lineup' | 'scoring.overlay.graphic.Player card' | 'scoring.overlay.graphic.Over summary' | 'scoring.overlay.graphic.Points table'> = {
  Lineup: 'scoring.overlay.graphic.Lineup',
  'Player card': 'scoring.overlay.graphic.Player card',
  'Over summary': 'scoring.overlay.graphic.Over summary',
  'Points table': 'scoring.overlay.graphic.Points table',
};

export function StreamOverlayScreen() {
  const { score, overlay, dispatch } = useScorer();
  const routes = useScorerRoutes();
  const s = useThemedStyles(styles);
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [preview, setPreview] = useState<{ graphic: OverlayGraphic; key: number } | null>(null);
  useEffect(() => {
    if (!preview) return;
    const timer = setTimeout(() => setPreview(null), 10_000);
    return () => clearTimeout(timer);
  }, [preview]);
  const update = (value: Partial<typeof overlay>) => dispatch({ type: 'overlay', value: { ...overlay, ...value } });
  if (!score) return <ScorerFrame><ScorerNotice>{t('scoring.overlay.needSession')}</ScorerNotice>
    <Button label={t('scoring.pad.setUpMatch')} onPress={() => routes.replace('setup')} /></ScorerFrame>;
  return <ScorerFrame>
    <ScorerHeader title={t('scoring.overlay.title')} subtitle={t('scoring.overlay.subtitle')} onBack={routes.back}
      trailing={<View style={s.badge}><Text style={s.badgeText}>{t('scoring.overlay.streamerBadge')}</Text></View>} />
    <OverlayPreview score={score} graphic={preview?.graphic ?? null} accent={overlay.color === 'blue' ? colors.primary : '#FFC83D'} />
    <ScorerSection title={t('scoring.overlay.linkSection')}>
      <View style={s.linkRow}><View style={s.link}><Text muted style={s.caption}>{t('scoring.overlay.notConnected')}</Text></View><Button label={t('scoring.overlay.copy')} disabled /></View>
      <ScorerNotice>{t('scoring.overlay.linkNotice')}</ScorerNotice>
    </ScorerSection>
    <ScorerSection title={t('scoring.overlay.showOnStream')}>
      <View style={s.graphics}>{graphics.map((graphic) => <Pressable key={graphic} accessibilityRole="button"
        accessibilityState={{ selected: preview?.graphic === graphic }} onPress={() => setPreview({ graphic, key: Date.now() })}
        style={({ pressed }) => [s.graphicButton, preview?.graphic === graphic && s.selected, pressed && s.pressed]}>
        <Text style={s.graphicLabel}>{t(GRAPHIC_KEYS[graphic])}</Text>
      </Pressable>)}</View>
      <ScorerNotice>{t('scoring.overlay.tapPreviewNotice')}</ScorerNotice>
    </ScorerSection>
    <View style={s.toggles}>
      <SwitchRow title={t('scoring.overlay.flashTitle')} detail={t('scoring.overlay.flashDetail')} value={overlay.flashes} onChange={(flashes) => update({ flashes })} />
      <SwitchRow title={t('scoring.overlay.milestonesTitle')} detail={t('scoring.overlay.milestonesDetail')} value={overlay.milestones} onChange={(milestones) => update({ milestones })} />
    </View>
    <View style={s.colorRow}><Text muted style={s.caption}>{t('scoring.overlay.colorLabel')}</Text><View style={s.swatches}>
      {(['blue', 'yellow'] as const).map((color) => <Pressable key={color} accessibilityRole="radio"
        accessibilityLabel={t('scoring.overlay.colorA11y', { color: t(color === 'blue' ? 'scoring.overlay.colorBlue' : 'scoring.overlay.colorYellow') })}
        accessibilityState={{ checked: overlay.color === color }}
        onPress={() => update({ color })} style={s.swatchTarget}>
        <View style={[s.swatch, { backgroundColor: color === 'blue' ? colors.primary : '#FFC83D' }, overlay.color === color && s.swatchSelected]} />
      </Pressable>)}
    </View></View>
    <ScorerNotice>{t('scoring.overlay.localNotice')}</ScorerNotice>
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
