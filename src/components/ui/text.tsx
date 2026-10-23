import { Text as RNText, type TextProps } from 'react-native';

import { typography, useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  muted?: boolean;
};

export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  return <RNText {...rest} style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style]} />;
}
