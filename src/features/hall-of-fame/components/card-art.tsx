import { StyleSheet } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Pattern, Rect, Stop, Text as SvgText } from 'react-native-svg';

import type { Tier } from '../awards';

/** Metal colours of a trophy card. Fixed in both themes: the card is a printed object, not app chrome. */
export type Metal = { light: string; mid: string; dark: string; deep: string; ink: string; banner: string; bannerInk: string };

export const METALS: Record<Tier, Metal> = {
  gold: { light: '#FBEFC6', mid: '#D8B66A', dark: '#9C7836', deep: '#5E4419', ink: '#1C1407', banner: '#24190A', bannerInk: '#F4DC97' },
  silver: { light: '#F8F9FB', mid: '#C3CAD3', dark: '#7F8894', deep: '#4A525C', ink: '#12171D', banner: '#1A2028', bannerInk: '#E6EAF0' },
};

type Props = { tier: Tier; /** Faint words behind the art, e.g. the award title. */ watermark: string };

/** The card's background: brushed metal, diagonal light bands, halftone corners, a faint watermark and a thin frame. */
export function CardArt({ tier, watermark }: Props) {
  const m = METALS[tier];
  const words = watermark.toUpperCase().split('\n');
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 140" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id={`bg-${tier}`} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={m.mid} />
          <Stop offset="0.45" stopColor={m.light} />
          <Stop offset="0.75" stopColor={m.mid} />
          <Stop offset="1" stopColor={m.dark} />
        </LinearGradient>
        <LinearGradient id={`band-${tier}`} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0" />
          <Stop offset="0.5" stopColor="#FFFFFF" stopOpacity="0.55" />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
        </LinearGradient>
        <Pattern id={`dots-${tier}`} width="2.4" height="2.4" patternUnits="userSpaceOnUse">
          <Circle cx="1.2" cy="1.2" r="0.45" fill={m.deep} fillOpacity={0.35} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width="100" height="140" fill={`url(#bg-${tier})`} />
      <Path d="M100 0 L100 40 L60 0 Z" fill={`url(#dots-${tier})`} />
      <Path d="M0 100 L0 140 L40 140 Z" fill={`url(#dots-${tier})`} />
      <Path d="M-10 64 L70 -16 L96 -16 L-10 90 Z" fill={`url(#band-${tier})`} />
      <Path d="M20 150 L110 60 L110 76 L36 150 Z" fill={`url(#band-${tier})`} opacity={0.7} />
      <Path d="M58 150 L110 98 L110 104 L64 150 Z" fill="#FFFFFF" opacity={0.25} />
      <Path d="M72 140 L72 104 L100 104" fill="none" stroke="#FFFFFF" strokeOpacity={0.6} strokeWidth={0.5} />
      <G rotation={-38} origin="24, 40" opacity={0.16}>
        {words.map((word, i) => (
          <SvgText key={word + i} x={-8} y={28 + i * 13} fontSize={12} fontWeight="900" fontStyle="italic" fill="#FFFFFF">{word}</SvgText>
        ))}
      </G>
      <Rect x="2.5" y="2" width="95" height="136" rx="6" fill="none" stroke={m.light} strokeOpacity={0.8} strokeWidth={0.9} />
    </Svg>
  );
}
