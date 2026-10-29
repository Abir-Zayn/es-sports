import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import Camera from 'lucide-react-native/icons/camera';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { spacing, useThemedStyles, type Palette } from '@/theme';

type Props = { label: string; uri?: string; onChange: (uri?: string, mimeType?: string) => void };
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_BYTES = 2 * 1024 * 1024;

export function TeamImagePicker({ label, uri, onChange }: Props) {
  const s = useThemedStyles(styles);
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
        setError('Choose a JPEG, PNG or WebP image under 2 MB.');
        return;
      }
      setError(null);
      onChange(asset.uri, mime);
    } catch {
      if (mounted.current) setError('Could not open photos. Try again.');
    } finally { busy.current = false; }
  }

  return <View style={s.wrap}>
    <Pressable accessibilityRole="button" accessibilityLabel={`${uri ? 'Change' : 'Add'} ${label} image`}
      onPress={() => void pick()} style={s.button}>
      {uri ? <Image source={{ uri }} style={s.image} contentFit="cover" /> : <Camera size={22} color={s.icon.color} />}
    </Pressable>
    {uri ? <Text onPress={() => onChange(undefined, undefined)} accessibilityRole="button" accessibilityLabel={`Remove ${label} image`} style={s.remove}>Remove</Text> : null}
    {error ? <Text accessibilityRole="alert" style={s.error}>{error}</Text> : null}
  </View>;
}

const styles = (c: Palette) => StyleSheet.create({
  wrap: { alignItems: 'center', gap: spacing.xs },
  button: { width: 48, height: 48, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', height: '100%' },
  icon: { color: c.textMuted },
  remove: { color: c.link, fontSize: 12 },
  error: { color: c.danger, fontSize: 12, maxWidth: 110 },
});
