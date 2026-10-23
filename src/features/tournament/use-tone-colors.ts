import { useTheme, type AvatarTone } from '@/theme';

export type ToneColors = {
  /** For bars, stripes and other fills. */
  fill: string;
  /** For text and icons; stays readable on the screen background. */
  ink: string;
};

const LIGHT_YELLOW_FILL = '#E0A100';

/** Returns a function that maps a team's tone to its fill and text colours in the current theme. */
export function useToneColors(): (tone: AvatarTone) => ToneColors {
  const { colors, scheme } = useTheme();
  return (tone) => {
    switch (tone) {
      case 'blue':
        return { fill: colors.primary, ink: colors.link };
      case 'yellow':
        return { fill: scheme === 'dark' ? colors.accent : LIGHT_YELLOW_FILL, ink: colors.accent };
      default:
        return { fill: colors.outline, ink: colors.textMuted };
    }
  };
}
