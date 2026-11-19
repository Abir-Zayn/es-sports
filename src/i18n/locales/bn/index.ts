import type { TranslationDict } from '../en';
import { bnAuth } from './auth';
import { bnCommon } from './common';
import { bnCommunity } from './community';
import { bnHome } from './home';
import { bnLegal } from './legal';
import { bnMatch } from './match';
import { bnMatchFriendly } from './match-friendly';
import { bnNotifications } from './notifications';
import { bnProfile } from './profile';
import { bnScoring } from './scoring';
import { bnScoringHandover } from './scoring-handover';

export const bn: TranslationDict = {
  ...bnCommon,
  ...bnAuth,
  ...bnLegal,
  ...bnHome,
  ...bnProfile,
  ...bnCommunity,
  ...bnNotifications,
  ...bnMatch,
  ...bnMatchFriendly,
  ...bnScoring,
  ...bnScoringHandover,
};
