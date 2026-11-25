import { Image } from 'expo-image';
import Coins from 'lucide-react-native/icons/coins';
import { Pressable, StyleSheet, View } from 'react-native';

import { InitialsAvatar, Text } from '@/components/ui';
import { useTranslation } from '@/i18n';
import { dp, radius, shadows, sizes, spacing, typography, useTheme, useThemedStyles, type Palette } from '@/theme';

import { teamCodes } from '@/features/scoring/setup-defaults';
import type { MatchSetup, TeamCode } from '../../types';

const ART = { bat: require('../../../../../assets/images/career-bat.svg'), bowl: require('../../../../../assets/images/career-ball.svg') };

type Props = { setup: MatchSetup; batting: TeamCode; onChange: (setup: MatchSetup) => void };

/** The toss as a face-off: tap the team that won it, then pick bat or bowl from two large cards. */
export function TossPicker({ setup, batting, onChange }: Props) {
  const { colors } = useTheme();
  const s = useThemedStyles(styles);
  const { t } = useTranslation();
  const team = (code: TeamCode) => setup.teams[code].team;
  const side = (code: TeamCode) => {
    const on = setup.tossWinner === code;
    return (
      <Pressable key={code} accessibilityRole="radio" accessibilityState={{ selected: on }}
        accessibilityLabel={t('scoring.setup.tossA11y', { team: team(code).name })}
        onPress={() => onChange({ ...setup, tossWinner: code })} style={({ pressed }) => [s.team, on && s.teamOn, pressed && s.pressed]}>
        <View style={[s.ring, on && { borderColor: colors.primary }]}>
          <InitialsAvatar label={team(code).short} tone={team(code).tone} imageUri={team(code).avatarUri} size={dp(56)} />
        </View>
        <Text style={[s.teamName, on && s.teamNameOn]} numberOfLines={2}>{team(code).name}</Text>
        {on ? (
          <View style={s.won}><Coins size={dp(12)} color={colors.link} /><Text style={s.wonText}>{t('scoring.setup.wonToss')}</Text></View>
        ) : <View style={s.wonSpacer} />}
      </Pressable>
    );
  };
  const choice = (id: 'bat' | 'bowl') => {
    const on = setup.decision === id;
    return (
      <Pressable key={id} accessibilityRole="radio" accessibilityState={{ selected: on }}
        accessibilityLabel={t(id === 'bat' ? 'friendly.toss.batFirst' : 'friendly.toss.bowlFirst')}
        onPress={() => onChange({ ...setup, decision: id })} style={({ pressed }) => [s.choice, on && s.choiceOn, pressed && s.pressed]}>
        <Image source={ART[id]} style={s.art} contentFit="contain" accessible={false} />
        <Text style={[s.choiceText, on && s.teamNameOn]}>{t(id === 'bat' ? 'friendly.toss.batFirst' : 'friendly.toss.bowlFirst')}</Text>
        <View style={[s.radio, on && { borderColor: colors.primary }]}>{on ? <View style={s.dot} /> : null}</View>
      </Pressable>
    );
  };
  return (
    <View style={s.card}>
      <View style={s.faceoff} accessibilityRole="radiogroup" accessibilityLabel={t('scoring.setup.whoWonToss')}>
        {side(teamCodes[0])}
        <Text style={s.vs} accessibilityElementsHidden>VS</Text>
        {side(teamCodes[1])}
      </View>
      <Text style={s.question}>{t('scoring.setup.choseToQuestion', { team: team(setup.tossWinner).name })}</Text>
      <View style={s.choices} accessibilityRole="radiogroup" accessibilityLabel={t('scoring.setup.choseTo')}>
        {choice('bat')}
        {choice('bowl')}
      </View>
      <View style={s.outcome} accessibilityLiveRegion="polite">
        <Text style={s.outcomeText}>{t('scoring.setup.willBatFirst', { team: team(batting).name })}</Text>
      </View>
    </View>
  );
}

const styles = (c: Palette) => StyleSheet.create({
  card: { backgroundColor: c.surface, borderRadius: radius.lg, padding: sizes.cardPaddingTight, gap: spacing.lg, ...shadows.card },
  faceoff: { flexDirection: 'row', alignItems: 'stretch', gap: spacing.sm },
  team: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, borderRadius: radius.md, borderWidth: 2, borderColor: 'transparent', backgroundColor: c.surfaceRaised },
  teamOn: { borderColor: c.primary, backgroundColor: c.primarySoft },
  pressed: { opacity: 0.75 },
  ring: { padding: dp(3), borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent' },
  teamName: { ...typography.labelMd, color: c.textMuted, textAlign: 'center' },
  teamNameOn: { color: c.text, fontWeight: '700' },
  won: { flexDirection: 'row', alignItems: 'center', gap: dp(4), backgroundColor: c.surface, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: dp(2) },
  wonText: { ...typography.labelSm, color: c.link },
  wonSpacer: { height: dp(20) },
  vs: { ...typography.labelMd, color: c.textMuted, alignSelf: 'center' },
  question: { ...typography.labelMd, color: c.text },
  choices: { flexDirection: 'row', gap: spacing.md },
  choice: { flex: 1, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg, borderRadius: radius.md, borderWidth: 2, borderColor: c.border, backgroundColor: c.surface },
  choiceOn: { borderColor: c.primary, backgroundColor: c.primarySoft },
  art: { width: dp(40), height: dp(40) },
  choiceText: { ...typography.labelMd, color: c.textMuted },
  radio: { width: dp(20), height: dp(20), borderRadius: radius.pill, borderWidth: 2, borderColor: c.border, alignItems: 'center', justifyContent: 'center' },
  dot: { width: dp(10), height: dp(10), borderRadius: radius.pill, backgroundColor: c.primary },
  outcome: { backgroundColor: c.surfaceRaised, borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, alignItems: 'center' },
  outcomeText: { ...typography.labelMd, color: c.link, textAlign: 'center' },
});
