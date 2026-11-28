import Svg, { Circle, Ellipse, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { BOUNDARY_COLOURS } from './live-ball-pill';

const SKIN = '#C68642';
const INK = '#1A1A1A';
type ArtProps = { size: number };

const DUCK = '#FFE14D';
const DUCK_LINE = '#8A6D00';
const PEACH = '#F4A07A';
const CAP = '#E53935';

/** A sad duck in a red cap walking off to the right, bat tucked under its wing and dragging behind. */
export function DuckArt({ size, colour }: ArtProps & { colour: string }) {
  const line = { stroke: DUCK_LINE, strokeWidth: 1.2 };
  return (
    <Svg width={size} height={size * 0.83} viewBox="0 0 120 100">
      <SvgText x={26} y={30} fill={colour} fontSize={15} fontWeight="bold" textAnchor="middle">OUT!</SvgText>
      <Path d="M60 86 L56 97 L66 95 L70 98 L68 86 Z" fill={PEACH} {...line} />
      <Path d="M74 86 L72 97 L82 95 L86 98 L82 86 Z" fill={PEACH} {...line} />
      <Path d="M48 66 L38 58 L42 70 L36 72 L48 76 Z" fill={DUCK} {...line} />
      <Path d="M72 66 Q75 46 79 38 L93 38 Q89 50 86 66 Z" fill={DUCK} {...line} />
      <Ellipse cx={66} cy={72} rx={22} ry={16} fill={DUCK} {...line} />
      <Circle cx={86} cy={32} r={13} fill={DUCK} {...line} />
      <Path d="M8.2 88.4 L54.2 67.4 L57.8 74.6 L11.8 95.6 Z" fill="#E9D8B0" stroke="#B89B6A" strokeWidth={1.2} />
      <Line x1={56} y1={71} x2={70} y2={64} stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
      <Path d="M54 66 Q66 58 80 64 Q74 78 56 75 Z" fill="#F5C800" {...line} />
      <Path d="M96 33 Q110 35 113 42 Q105 47 95 42 Z" fill={PEACH} {...line} />
      <Path d="M85 30 Q88 32 92 30" stroke={INK} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M84 25 L92 27" stroke={INK} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M90 35 Q92 39 90 41 Q88 39 90 35 Z" fill="#8FD3FF" />
      <Path d="M73 27 Q74 14 87 14 Q99 15 99 25 Z" fill={CAP} stroke="#B71C1C" strokeWidth={1} />
      <Path d="M96 23 Q108 21 112 27 Q104 30 96 27 Z" fill="#C62828" />
      <Circle cx={86} cy={14.5} r={1.6} fill="#B71C1C" />
    </Svg>
  );
}

/** Half a player rising from below, holding a "4" card over their head. */
export function FourArt({ size }: ArtProps) {
  return (
    <Svg width={size} height={size * 1.07} viewBox="0 0 140 150">
      <Path d="M30 150 Q30 112 50 108 L90 108 Q110 112 110 150 Z" fill="#2563EB" />
      <Line x1={44} y1={114} x2={34} y2={56} stroke={SKIN} strokeWidth={10} strokeLinecap="round" />
      <Line x1={96} y1={114} x2={106} y2={56} stroke={SKIN} strokeWidth={10} strokeLinecap="round" />
      <Circle cx={70} cy={90} r={18} fill={SKIN} />
      <Path d="M52 88 A18 18 0 0 1 88 88 Z" fill="#1E3A8A" />
      <Rect x={84} y={84} width={14} height={4} rx={2} fill="#1E3A8A" />
      <Rect x={28} y={8} width={84} height={52} rx={6} fill={BOUNDARY_COLOURS.four.background} />
      <SvgText x={70} y={48} fill={BOUNDARY_COLOURS.four.color} fontSize={40} fontWeight="bold" textAnchor="middle">4</SvgText>
      <Circle cx={34} cy={54} r={7} fill={SKIN} />
      <Circle cx={106} cy={54} r={7} fill={SKIN} />
    </Svg>
  );
}

/** Half an umpire in a black hat rising from below, both arms up for a six. */
export function SixArt({ size }: ArtProps) {
  const arm = (x1: number, x2: number) => (
    <>
      <Line x1={x1} y1={122} x2={x2} y2={48} stroke="#CFC8B8" strokeWidth={13} strokeLinecap="round" />
      <Line x1={x1} y1={122} x2={x2} y2={48} stroke="#F4F1E8" strokeWidth={10} strokeLinecap="round" />
      <Circle cx={x2} cy={42} r={7} fill={SKIN} />
    </>
  );
  return (
    <Svg width={size} height={size * 1.14} viewBox="0 0 140 160">
      <Path d="M26 160 Q26 122 48 116 L92 116 Q114 122 114 160 Z" fill="#F4F1E8" stroke="#CFC8B8" strokeWidth={2} />
      <Path d="M64 116 L70 132 L76 116 Z" fill={INK} />
      {arm(44, 28)}
      {arm(96, 112)}
      <Circle cx={70} cy={100} r={17} fill={SKIN} />
      <Circle cx={64} cy={100} r={2} fill={INK} />
      <Circle cx={76} cy={100} r={2} fill={INK} />
      <Rect x={55} y={68} width={30} height={18} rx={4} fill={INK} />
      <Ellipse cx={70} cy={86} rx={28} ry={5} fill={INK} />
      <Circle cx={70} cy={30} r={22} fill={BOUNDARY_COLOURS.six.background} />
      <SvgText x={70} y={44} fill={BOUNDARY_COLOURS.six.color} fontSize={36} fontWeight="bold" textAnchor="middle">6</SvgText>
    </Svg>
  );
}
