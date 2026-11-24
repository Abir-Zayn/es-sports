import Star from 'lucide-react-native/icons/star';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';

import type { Tier } from '../awards';
import { CardArt, METALS } from './card-art';
import { Shield } from './card-emblem';

type Props = {
  tier: Tier;
  /** Three lines, e.g. "Player\nof the\nmonth": the middle one is the small joining line. */
  title: string;
  /** Size unit: the card's width / 160. */
  u: number;
  /** What sits in the shield: a trophy face down, the player once revealed. */
  emblem: ReactNode;
  footer: ReactNode;
};

/** One side of a trophy card: staggered title, three stars, a big shield, and a footer line. */
export function CardFace({ tier, title, u, emblem, footer }: Props) {
  const m = METALS[tier];
  const [lead = '', join = '', last = ''] = title.toUpperCase().split('\n');
  const big = { color: m.ink, fontSize: 22 * u, lineHeight: 23 * u };
  return (
    <View style={[StyleSheet.absoluteFill, styles.face, { paddingVertical: 10 * u, paddingHorizontal: 12 * u }]}>
      <CardArt tier={tier} watermark={title} />
      <View style={styles.title}>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.heavy, big, { paddingRight: 18 * u }]}>{lead}</Text>
        <Text numberOfLines={1} style={[styles.heavy, styles.right, { color: m.ink, fontSize: 11 * u, lineHeight: 11 * u, marginRight: 22 * u }]}>{join}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.heavy, styles.right, big]}>{last}</Text>
      </View>
      <View style={[styles.stars, { gap: 6 * u }]}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ marginBottom: i === 1 ? 5 * u : 0 }}>
            <Star size={(i === 1 ? 17 : 13) * u} color={m.deep} fill={m.dark} strokeWidth={1.5} />
          </View>
        ))}
      </View>
      <Shield tier={tier} width={84 * u}>{emblem}</Shield>
      <View style={styles.footer}>{footer}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  face: { alignItems: 'center', justifyContent: 'space-between' },
  title: { alignSelf: 'stretch' },
  heavy: { fontWeight: '900', fontStyle: 'italic', letterSpacing: -0.3 },
  right: { textAlign: 'right' },
  stars: { flexDirection: 'row', alignItems: 'flex-end' },
  footer: { alignSelf: 'stretch', alignItems: 'center' },
});
