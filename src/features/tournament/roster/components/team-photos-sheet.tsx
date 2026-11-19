import { Image } from 'expo-image';
import Camera from 'lucide-react-native/icons/camera';
import ImageIcon from 'lucide-react-native/icons/image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { dp, radius, sizes, spacing, useTheme, useThemedStyles, type Palette } from '@/theme';

import type { RosterTeam, TeamPhotosInput } from '../types';
import { pickTeamImageAsset, type TeamPhotoKind } from './pick-team-image';
import { Sheet } from './sheet';

type Props = { team: RosterTeam | null; saving: boolean; error: string | null; onSave: (photos: TeamPhotosInput) => void; onClose: () => void };

/** Modal sheet to upload, replace, or remove a team's profile and cover photos. */
export function TeamPhotosSheet({ team, saving, error, onSave, onClose }: Props) {
  const [picking, setPicking] = useState(false);
  return (
    <Sheet visible={team !== null} title={team ? `${team.name} photos` : 'Team photos'} onClose={() => { if (!saving && !picking) onClose(); }}>
      {team ? <TeamPhotosForm key={team.id} team={team} saving={saving} error={error} onPickingChange={setPicking} onSave={onSave} /> : null}
    </Sheet>
  );
}

type FormProps = { team: RosterTeam; saving: boolean; error: string | null; onPickingChange: (picking: boolean) => void; onSave: (photos: TeamPhotosInput) => void };

function TeamPhotosForm({ team, saving, error, onPickingChange, onSave }: FormProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [logoUri, setLogoUri] = useState(team.logoUrl ?? '');
  const [coverUri, setCoverUri] = useState(team.coverUrl ?? '');
  const [picking, setPicking] = useState<TeamPhotoKind | null>(null);
  const [photoError, setPhotoError] = useState('');
  const [failedCoverUri, setFailedCoverUri] = useState('');
  const pending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onPickingChange(false); };
  }, [onPickingChange]);

  const busy = saving || picking !== null;
  const changed = logoUri !== (team.logoUrl ?? '') || coverUri !== (team.coverUrl ?? '');
  const shownError = photoError || error;

  async function pick(kind: TeamPhotoKind) {
    if (pending.current || saving) return;
    pending.current = true;
    setPicking(kind);
    onPickingChange(true);
    setPhotoError('');
    try {
      const nextUri = await pickTeamImageAsset(kind);
      if (!mounted.current || !nextUri) return;
      if (kind === 'profile') setLogoUri(nextUri);
      else { setFailedCoverUri(''); setCoverUri(nextUri); }
    } catch (cause) {
      if (mounted.current) setPhotoError(cause instanceof Error ? cause.message : 'Could not open your photos. Please try again.');
    } finally {
      pending.current = false;
      if (mounted.current) { setPicking(null); onPickingChange(false); }
    }
  }

  function clear(kind: TeamPhotoKind) {
    setPhotoError('');
    if (kind === 'profile') setLogoUri('');
    else setCoverUri('');
  }

  function handlePreviewPress(kind: TeamPhotoKind) {
    if (busy) return;
    const active = kind === 'profile' ? Boolean(logoUri) : Boolean(coverUri && coverUri !== failedCoverUri);
    if (!active) { void pick(kind); return; }
    Alert.alert(`Team ${kind === 'profile' ? 'profile photo' : 'cover photo'}`, 'Choose an action for this image', [
      { text: 'Change photo', onPress: () => { void pick(kind); } },
      { text: 'Remove', style: 'destructive', onPress: () => clear(kind) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <>
      <View style={styles.artwork}>
        <Pressable accessibilityRole="button" accessibilityLabel={coverUri ? 'Change team cover photo' : 'Add team cover photo'}
          disabled={busy} onPress={() => handlePreviewPress('cover')} style={({ pressed }) => [styles.cover, pressed && styles.pressed]}>
          {coverUri && coverUri !== failedCoverUri ? (
            <Image source={{ uri: coverUri }} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityLabel={`${team.name} cover preview`}
              onError={() => { setFailedCoverUri(coverUri); setPhotoError('This cover photo is unavailable. Choose another photo.'); }} />
          ) : (
            <View style={styles.coverEmpty}>
              <ImageIcon size={sizes.tabIcon} color={colors.link} strokeWidth={1.5} />
              <Text variant="caption" style={styles.coverHint}>Tap to add team cover photo</Text>
            </View>
          )}
          {picking === 'cover' ? <ActivityIndicator size="small" color={colors.link} style={styles.loader} /> : null}
        </Pressable>
        <View style={styles.profileWrap}>
          <Pressable accessibilityRole="button" accessibilityLabel={logoUri ? 'Change team profile photo' : 'Add team profile photo'}
            disabled={busy} onPress={() => handlePreviewPress('profile')} style={({ pressed }) => [styles.profileBtn, pressed && styles.pressed]}>
            <InitialsAvatar label={team.short} tone={team.tone} imageUri={logoUri || undefined} size={dp(76)} />
            {picking === 'profile' ? <ActivityIndicator size="small" color={colors.link} style={styles.loader} /> : null}
            <View style={styles.cameraBadge}><Camera size={dp(12)} color={colors.text} /></View>
          </Pressable>
        </View>
      </View>
      <View style={styles.controls}>
        <View style={styles.controlRow}>
          <Button label={logoUri ? 'Replace profile photo' : 'Upload profile photo'} variant="secondary" size="compact" disabled={busy} onPress={() => void pick('profile')} />
          {logoUri ? <Button label="Remove" variant="ghost" size="compact" disabled={busy} accessibilityLabel="Remove team profile photo" onPress={() => clear('profile')} /> : null}
        </View>
        <View style={styles.controlRow}>
          <Button label={coverUri ? 'Replace cover photo' : 'Upload cover photo'} variant="secondary" size="compact" disabled={busy} onPress={() => void pick('cover')} />
          {coverUri ? <Button label="Remove" variant="ghost" size="compact" disabled={busy} accessibilityLabel="Remove team cover photo" onPress={() => clear('cover')} /> : null}
        </View>
      </View>
      <Text variant="caption" muted>Replacing or removing a photo permanently deletes the old image.</Text>
      {shownError ? <Text accessibilityRole="alert" style={styles.error}>{shownError}</Text> : null}
      <Button label="Save photos" loading={saving} disabled={busy || !changed}
        onPress={() => onSave({ logoUri, coverUri, previousLogoUrl: team.logoUrl ?? null, previousCoverUrl: team.coverUrl ?? null })} />
    </>
  );
}

const createStyles = (colors: Palette) =>
  StyleSheet.create({
    artwork: { paddingBottom: dp(28) },
    cover: { width: '100%', aspectRatio: 1.88, backgroundColor: colors.primarySoft, borderRadius: radius.lg, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    coverEmpty: { alignItems: 'center', gap: spacing.xs },
    coverHint: { color: colors.link },
    profileWrap: { position: 'absolute', right: spacing.lg, bottom: 0, width: dp(84), height: dp(84), padding: spacing.xs, borderRadius: radius.pill, backgroundColor: colors.surface },
    profileBtn: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    cameraBadge: { position: 'absolute', right: 0, bottom: 0, width: dp(24), height: dp(24), borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
    loader: { position: 'absolute' },
    pressed: { transform: [{ scale: 0.95 }] },
    controls: { gap: spacing.sm },
    controlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    error: { color: colors.dangerSoftText },
  });
