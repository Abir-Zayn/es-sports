import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import type { Tier } from '../awards';
import { METALS } from './card-art';

const OUTER = 'M50 3 L95 15 C95 60 78 92 50 107 C22 92 5 60 5 15 Z';
const INNER = 'M50 11 L87 22 C87 60 72 86 50 98 C28 86 13 60 13 22 Z';

/** The big bevelled shield in the middle of the card. Holds a trophy face down, the player once revealed. */
export function Shield({ tier, width, children }: { tier: Tier; width: number; children: ReactNode }) {
  const m = METALS[tier];
  return (
    <View style={{ width, height: width * 1.1, alignItems: 'center' }}>
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 110">
        <Defs>
          <LinearGradient id={`rim-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={m.light} />
            <Stop offset="0.5" stopColor={m.dark} />
            <Stop offset="1" stopColor={m.deep} />
          </LinearGradient>
          <LinearGradient id={`face-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={m.mid} />
            <Stop offset="0.5" stopColor={m.light} />
            <Stop offset="1" stopColor={m.dark} />
          </LinearGradient>
        </Defs>
        <Path d={OUTER} fill={`url(#rim-${tier})`} />
        <Path d={INNER} fill={`url(#face-${tier})`} stroke={m.deep} strokeOpacity={0.5} strokeWidth={0.8} />
      </Svg>
      {children}
    </View>
  );
}

/** A solid trophy cup with handles, stem and plinth, in the card's darker metal. */
export function TrophyArt({ tier, size }: { tier: Tier; size: number }) {
  const m = METALS[tier];
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={`cup-${tier}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={m.deep} />
          <Stop offset="0.35" stopColor={m.dark} />
          <Stop offset="0.6" stopColor={m.deep} />
          <Stop offset="1" stopColor={m.ink} />
        </LinearGradient>
      </Defs>
      <Path d="M30 22 H16 C13 40 22 50 33 50" fill="none" stroke={m.deep} strokeWidth={6} strokeLinecap="round" />
      <Path d="M70 22 H84 C87 40 78 50 67 50" fill="none" stroke={m.deep} strokeWidth={6} strokeLinecap="round" />
      <Path d="M27 12 H73 V30 C73 50 62 61 50 63 C38 61 27 50 27 30 Z" fill={`url(#cup-${tier})`} />
      <Rect x="45" y="62" width="10" height="12" fill={m.deep} />
      <Path d="M36 74 H64 L67 81 H33 Z" fill={`url(#cup-${tier})`} />
      <Rect x="29" y="81" width="42" height="9" rx="1.5" fill={m.ink} />
    </Svg>
  );
}
