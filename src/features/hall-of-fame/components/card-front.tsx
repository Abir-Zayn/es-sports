import { StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { initialsOf } from '@/lib/initials';

import type { HallWinner } from '../awards';
import { CardArt, METALS } from './card-art';
import { CARD_TEXT_SCALE } from './card-scale';

/** The brand as printed on the card; not translated. */
const BRAND = 'ES-SPORTS';

type Props = {
  winner: HallWinner;
  photo?: string;
  /** The award title, printed faintly behind the player. */
  title: string;
  tierName: string;
  /** Size unit: the card's width / 160. */
  u: number;
};

/** The revealed side: the player's figures top left, the brand top right, their photo, and their name bottom right. */
export function CardFront({ winner, photo, title, tierName, u }: Props) {
  const { t } = useTranslation();
  const { player, points, tier } = winner;
  const m = METALS[tier];
  const avg = winner.average == null ? '—' : winner.average.toFixed(1);
  const stats = [
    { key: 'pts', label: t('hallOfFame.points'), value: points.toFixed(1), big: true },
    { key: 'runs', label: t('hallOfFame.runs'), value: String(player.runs), big: false },
    { key: 'wkts', label: t('hallOfFame.wickets'), value: String(player.wickets), big: false },
    { key: 'avg', label: t('hallOfFame.average'), value: avg, big: false },
  ];
  const ink = { color: m.ink };

  return (
    <View style={[StyleSheet.absoluteFill, { padding: 12 * u }]}>
      <CardArt tier={tier} watermark={title} />
      <View style={styles.top}>
        <View style={{ gap: 5 * u }}>
          {stats.map((s) => (
            <View key={s.key}>
              <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.label, ink, { fontSize: 7.5 * u, lineHeight: 9 * u }]}>{s.label.toUpperCase()}</Text>
              <Text maxFontSizeMultiplier={CARD_TEXT_SCALE}
                style={[styles.value, ink, { fontSize: (s.big ? 20 : 15) * u, lineHeight: (s.big ? 22 : 17) * u }]}>{s.value}</Text>
            </View>
          ))}
        </View>
        <View style={styles.brand}>
          <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.wordmark, ink, { fontSize: 12 * u, lineHeight: 14 * u }]}>{BRAND}</Text>
          <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} style={[styles.label, ink, { fontSize: 7.5 * u, lineHeight: 10 * u }]}>{tierName.toUpperCase()}</Text>
        </View>
      </View>
      <View style={[styles.photo, { right: 12 * u, top: 56 * u }]}>
        <InitialsAvatar label={initialsOf(player.name)} imageUri={photo} size={80 * u} tone="neutral" borderColor={m.deep} borderWidth={3 * u} />
      </View>
      <View style={[styles.bottom, { left: 12 * u, right: 12 * u, bottom: 12 * u }]}>
        <View style={[styles.banner, { backgroundColor: m.banner, paddingVertical: 4 * u, paddingHorizontal: 10 * u, borderRadius: 3 * u }]}>
          <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}
            style={[styles.name, { color: m.bannerInk, fontSize: 13 * u, lineHeight: 16 * u }]}>{player.name.toUpperCase()}</Text>
        </View>
        {player.team ? (
          <Text maxFontSizeMultiplier={CARD_TEXT_SCALE} numberOfLines={1}
            style={[styles.label, ink, { fontSize: 7.5 * u, lineHeight: 10 * u, marginTop: 3 * u }]}>{player.team.toUpperCase()}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  label: { fontWeight: '700', letterSpacing: 0.8 },
  value: { fontWeight: '900', fontStyle: 'italic', fontVariant: ['tabular-nums'] },
  brand: { alignItems: 'flex-end' },
  wordmark: { fontWeight: '900', fontStyle: 'italic', letterSpacing: 0.5 },
  photo: { position: 'absolute' },
  bottom: { position: 'absolute', alignItems: 'flex-end' },
  banner: { maxWidth: '85%' },
  name: { fontWeight: '800', letterSpacing: 0.5, textAlign: 'right' },
});
