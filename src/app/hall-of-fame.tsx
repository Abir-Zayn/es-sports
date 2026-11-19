import { ComingSoonScreen } from '@/components/coming-soon-screen';
import { useTranslation } from '@/i18n';

export default function Screen() {
  const { t } = useTranslation();
  return <ComingSoonScreen title={t('routes.hallOfFame')} />;
}
