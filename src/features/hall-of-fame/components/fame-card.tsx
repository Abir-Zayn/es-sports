import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { Button, InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';

import type { HallWinner } from '../awards';
import { METALS } from './card-art';
import { TrophyArt } from './card-emblem';
import { CardFace } from './card-face';
import { CARD_TEXT_SCALE } from './card-scale';

export const CARD_RATIO = 1.4;
const FLIP_MS = 600;
const FILL = { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 } as const;

type Props = {
  winner: HallWinner;
  photo?: string;
  /** "Player\nof the\nmonth" and the like. */
  title: string;
  width: number;
  onOpenPlayer: () => void;
};

/** A trophy card that starts face down; a tap flips it to reveal the player, a second tap opens their profile. */
export function FameCard({ winner, photo, title, width, onOpenPlayer }: Props) {
  const { t } = useTranslation();
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(false);
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withTiming(revealed ? 1 : 0, { duration: reduceMotion ? 0 : FLIP_MS, easing: Easing.out(Easing.cubic) });
  }, [revealed, reduceMotion, progress]);
  // Each side turns away at the halfway point; opacity covers Android, where backfaceVisibility is unreliable.
  const backStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 1 : 0, transform: [{ perspective: 1000 }, { rotateY: `${progress.value * 180}deg` }],
  }));
  const frontStyle = useAnimatedStyle(() => ({
    opacity: progress.value < 0.5 ? 0 : 1, transform: [{ perspective: 1000 }, { rotateY: `${progress.value * 180 - 180}deg` }],
  }));

  const { player, points, tier } = winner;
  const m = METALS[tier];
  const u = width / 160;
  const tierName = t(tier === 'gold' ? 'hallOfFame.gold' : 'hallOfFame.silver');
  const avg = winner.average == null ? '—' : winner.average.toFixed(1);
  const score = points.toFixed(1);
  const label = revealed
    ? t('hallOfFame.revealedA11y', { tier: tierName, name: player.name, points: score, runs: player.runs, wickets: player.wickets, average: avg })
    : t('hallOfFame.hiddenA11y', { tier: tierName, title: title.replace(/\n/g, ' ') });
  const caption = { color: m.ink, fontSize: 7.5 * u, lineHeight: 10 * u };

  return (
    <View style={[styles.slot, { width }]}>
    <Pressable accessibilityRole="button" accessibilityLabel={label}
      accessibilityHint={t(revealed ? 'hallOfFame.openHint' : 'hallOfFame.revealHint')}
      onPress={() => (revealed ? onOpenPlayer() : setRevealed(true))}
      style={({ pressed }) => [styles.card, { width, height: width * CARD_RATIO, borderRadius: 12 * u }, pressed && styles.pressed]}>
      <Animated.View style={[styles.side, { borderRadius: 12 * u }, backStyle]}>
        <CardFace tier={tier} title={title} u={u}
          emblem={<View style={{ marginTop: 12 * u }}><TrophyArt tier={tier} size={56 * u} /></View>}
          footer={<Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.caption, caption]}>{`${tierName} · ${t('hallOfFame.tapToReveal')}`.toUpperCase()}</Text>} />
      </Animated.View>
      {revealed ? (
        <Animated.View style={[styles.side, { borderRadius: 12 * u }, frontStyle]}>
          <CardFace tier={tier} title={title} u={u}
            emblem={<View style={{ alignItems: 'center', marginTop: 11 * u }}>
              <InitialsAvatar label={initialsOf(player.name)} imageUri={photo} size={46 * u} tone="neutral" borderColor={m.deep} borderWidth={2 * u} />
              <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.score, { color: m.ink, fontSize: 14 * u, lineHeight: 16 * u, marginTop: 3 * u }]}>{score}</Text>
              <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.caption, caption, { fontSize: 7.5 * u, lineHeight: 9 * u }]}>{t('hallOfFame.points')}</Text>
            </View>}
            footer={<>
              <View style={[styles.banner, { backgroundColor: m.banner, paddingVertical: 3 * u, paddingHorizontal: 8 * u, borderRadius: 3 * u }]}>
                <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
                  style={[styles.name, { color: m.bannerInk, fontSize: 12 * u, lineHeight: 15 * u }]}>{player.name.toUpperCase()}</Text>
              </View>
              <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} numberOfLines={1} style={[styles.caption, caption, { marginTop: 2 * u }]}>
                {t('hallOfFame.statLine', { runs: player.runs, wickets: player.wickets, average: avg })}
              </Text>
            </>} />
        </Animated.View>
      ) : null}
    </Pressable>
    {/* The second tap on the card also opens the profile; the button makes that visible. */}
    {revealed ? <Button label={t('hallOfFame.viewCareer')} variant="secondary" onPress={onOpenPlayer} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { gap: 12 },
  pressed: { opacity: 0.9 },
  card: { shadowColor: '#000000', shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  side: { ...FILL, overflow: 'hidden', backfaceVisibility: 'hidden' },
  caption: { fontWeight: '700', letterSpacing: 0.8 },
  score: { fontWeight: '900', fontVariant: ['tabular-nums'] },
  banner: { alignSelf: 'stretch', alignItems: 'center' },
  name: { fontWeight: '800', letterSpacing: 0.5 },
});
