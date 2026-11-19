import Eye from 'lucide-react-native/icons/eye';
import EyeOff from 'lucide-react-native/icons/eye-off';
import { useState } from 'react';
import { Pressable } from 'react-native';

import { TextField } from '@/components/ui/text-field';
import { useTranslation } from '@/i18n';
import { sizes, useTheme } from '@/theme';

type Props = Omit<React.ComponentProps<typeof TextField>, 'secureTextEntry' | 'trailing' | 'label'> & { label?: string };

/** A TextField for passwords with its own show/hide eye button. */
export function PasswordField({ label, ...rest }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const Icon = visible ? EyeOff : Eye;
  return (
    <TextField
      label={label ?? t('ui.password')}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="current-password"
      textContentType="password"
      {...rest}
      secureTextEntry={!visible}
      trailing={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? t('ui.hidePassword') : t('ui.showPassword')}
          hitSlop={sizes.hitSlop}
          onPress={() => setVisible((v) => !v)}
        >
          <Icon size={sizes.icon} color={colors.textMuted} strokeWidth={2} />
        </Pressable>
      }
    />
  );
}
