import { LegalDocumentScreen } from './legal-document-screen';
import { termsSections } from './terms-content';

export function TermsScreen() {
  return <LegalDocumentScreen title="Terms and Conditions" sections={termsSections} />;
}
