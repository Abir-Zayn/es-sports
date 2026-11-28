import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Camera from 'lucide-react-native/icons/camera';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, sizes, spacing, typography, useThemedStyles, type Palette } from '@/theme';

type Props = {
  label: string;
  uri?: string;
  /** Square size in px. */
  size?: number;
  /** Shown with a camera badge instead of the bare camera icon while there is no image, e.g. the team's initials. */
  placeholder?: ReactNode;
  onChange: (uri?: string, mimeType?: string) => void;
};
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export function TeamImagePicker({ label, uri, size = dp(48), placeholder, onChange }: Props) {
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  async function pick() {
    if (busy.current) return;
    busy.current = true;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
      if (!mounted.current || result.canceled) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      if (!TYPES.includes(mime) || (asset.fileSize && asset.fileSize > MAX_BYTES)) {
        setError(t('friendly.image.invalidOrLarge'));
        return;
      }
      setError(null);
      onChange(asset.uri, mime);
    } catch {
      if (mounted.current) setError(t('friendly.image.openPhotosFailed'));
    } finally { busy.current = false; }
  }

  return <View style={s.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={t(uri ? 'friendly.image.changeA11y' : 'friendly.image.addA11y', { label })}
      onPress={() => void pick()} style={({ pressed }) => [pressed && s.pressed]}>
      <View style={[s.button, { width: size, height: size, borderRadius: radius.pill }]}>
        {uri ? <Image source={{ uri }} style={s.image} contentFit="cover" />
          : placeholder ?? <Camera size={size > dp(56) ? sizes.tabIcon : sizes.icon} color={s.icon.color} />}
      </View>
      {placeholder ? <View style={s.badge}><Camera size={dp(12)} color={s.badgeIcon.color} /></View> : null}
    </Pressable>
    {uri ? <Text onPress={() => onChange(undefined, undefined)} accessibilityRole="button" accessibilityLabel={t('friendly.image.removeA11y', { label })} style={s.remove}>{t('friendly.image.remove')}</Text> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  button: { backgroundColor: c.surfaceRaised, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  icon: { color: c.textMuted },
  pressed: { transform: [{ scale: 0.95 }] },
  badge: {
    position: 'absolute', right: -dp(2), bottom: -dp(2), width: dp(22), height: dp(22), alignItems: 'center', justifyContent: 'center',
    borderRadius: radius.pill, borderWidth: 2, borderColor: c.surface, backgroundColor: c.primary,
  },
  badgeIcon: { color: c.primaryText },
  remove: { ...typography.labelSm, color: c.link },
  error: { ...typography.bodySm, color: c.danger, maxWidth: dp(160), textAlign: 'center' },
});
