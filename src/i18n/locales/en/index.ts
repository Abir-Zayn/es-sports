import { enAuth } from './auth';
import { enCommon } from './common';
import { enCommunity } from './community';
import { enHome } from './home';
import { enLegal } from './legal';
import { enMatch } from './match';
import { enMatchFriendly } from './match-friendly';
import { enNotifications } from './notifications';
import { enProfile } from './profile';
import { enScoring } from './scoring';
import { enScoringHandover } from './scoring-handover';

export const en = {
  ...enCommon,
  ...enAuth,
  ...enLegal,
  ...enHome,
  ...enProfile,
  ...enCommunity,
  ...enNotifications,
  ...enMatch,
  ...enMatchFriendly,
  ...enScoring,
  ...enScoringHandover,
} as const;

export type TranslationKey = keyof typeof en;
export type TranslationDict = Record<TranslationKey, string>;
