import { LegalDocumentScreen } from './legal-document-screen';
import { privacySections } from './privacy-content';

export function PrivacyScreen() {
  return <LegalDocumentScreen title="Privacy Policy" sections={privacySections} />;
}
