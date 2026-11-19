import { StyleSheet, Text as RNText, type TextProps, type TextStyle } from 'react-native';

import { useLocale } from '@/i18n';
import { typography, useTheme, type TypographyVariant } from '@/theme';

type Props = TextProps & {
  variant?: TypographyVariant;
  muted?: boolean;
};

/** Android clips Bangla vowel marks and splits conjuncts when letterSpacing is non-zero. */
function banglaSafeStyle(variant: TypographyVariant, style: TextProps['style']): TextStyle {
  const flat = StyleSheet.flatten([typography[variant], style]) ?? typography[variant];
  const fontSize = typeof flat.fontSize === 'number' ? flat.fontSize : typography[variant].fontSize ?? 14;
  const lineHeight = typeof flat.lineHeight === 'number' ? flat.lineHeight : 0;
  return {
    letterSpacing: 0,
    textTransform: 'none',
    lineHeight: Math.max(lineHeight, Math.ceil(fontSize * 1.45)),
  };
}

export function Text({ variant = 'body', muted = false, style, ...rest }: Props) {
  const { colors } = useTheme();
  const locale = useLocale();
  const bnFix = locale === 'bn' ? banglaSafeStyle(variant, style) : null;
  return <RNText {...rest} style={[typography[variant], { color: muted ? colors.textMuted : colors.text }, style, bnFix]} />;
}
