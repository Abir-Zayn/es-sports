import { useTranslation } from '@/i18n';

import { LegalDocumentScreen } from './legal-document-screen';
import { getPrivacySections } from './privacy-content';

export function PrivacyScreen() {
  const { t } = useTranslation();
  return <LegalDocumentScreen title={t('legal.privacyTitle')} sections={getPrivacySections(t)} />;
}
