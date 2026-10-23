import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

const googleG = require('../../../assets/images/google-g.png');
const phoneIcon = require('../../../assets/images/phone.png');

/** Google and phone options. Both are placeholders until those providers are set up. */
export function SocialOptions() {
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!notice) return;
    const id = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(id);
  }, [notice]);

  return (
    <View style={styles.wrap}>
      <Text variant="caption" muted style={styles.or}>
        or
      </Text>
      <Button
        variant="secondary"
        label="Continue with Google"
        leading={<Image source={googleG} style={styles.logo} contentFit="contain" accessibilityElementsHidden />}
        onPress={() => setNotice('Google login is coming soon.')}
      />
      <Button
        variant="secondary"
        label="Continue with phone"
        leading={<Image source={phoneIcon} style={styles.logo} contentFit="contain" accessibilityElementsHidden />}
        onPress={() => setNotice('Phone login is coming soon.')}
      />
      {/* Absolute, so the message never adds height between the phone button and the footer link. */}
      <View style={styles.noticeSlot} accessibilityLiveRegion="polite">
        {notice ? (
          <Text variant="caption" muted>
            {notice}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  or: { textAlign: 'center' },
  logo: { width: 20, height: 20 },
  noticeSlot: { position: 'absolute', left: 0, right: 0, top: '100%', marginTop: spacing.xs, alignItems: 'center' },
});
