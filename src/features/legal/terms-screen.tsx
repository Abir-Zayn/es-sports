import { useTranslation } from '@/i18n';

import { LegalDocumentScreen } from './legal-document-screen';
import { getTermsSections } from './terms-content';

export function TermsScreen() {
  const { t } = useTranslation();
  return <LegalDocumentScreen title={t('legal.termsTitle')} sections={getTermsSections(t)} />;
}
