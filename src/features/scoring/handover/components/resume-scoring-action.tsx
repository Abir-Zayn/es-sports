import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui';
import { useAuth } from '@/features/auth';
import { canScoreMatch } from '@/features/scoring/data/match-repository';
import { useTranslation } from '@/i18n';

/**
 * "Continue scoring" for the account allowed to score an unfinished match, so a scorer who left the scorer or had
 * the app killed can get back in. The scorer rebuilds the score from the server when it opens.
 */
export function ResumeScoringAction({ matchId, onOpen }: { matchId: string; /** Runs before opening the scorer, e.g. to close a sheet. */ onOpen?: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const userId = useAuth().session?.user.id;
  const allowed = useQuery({
    queryKey: ['scoring', 'can-score', matchId, userId ?? ''], queryFn: () => canScoreMatch(matchId),
    enabled: Boolean(userId) && matchId.length > 0, staleTime: 0,
  });
  if (allowed.data !== true) return null;
  return <Button label={t('handover.resume.btn')} onPress={() => { onOpen?.(); router.push({ pathname: '/scorer/[id]', params: { id: matchId } }); }} />;
}
