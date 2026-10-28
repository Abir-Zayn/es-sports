import { useRouter } from 'expo-router';

import { useScorer } from './scorer-provider';

const paths = {
  setup: '/scorer/[id]', pad: '/scorer/[id]/pad', shot: '/scorer/[id]/shot',
  wicket: '/scorer/[id]/wicket', over: '/scorer/[id]/over', overlay: '/scorer/[id]/overlay',
} as const;
export type ScorerPage = keyof typeof paths;

export function useScorerRoutes() {
  const router = useRouter();
  const { matchId } = useScorer();
  const push = (page: ScorerPage) => router.push({ pathname: paths[page], params: { id: matchId } });
  const replace = (page: ScorerPage) => router.replace({ pathname: paths[page], params: { id: matchId } });
  const back = () => router.canGoBack() ? router.back() : router.replace({ pathname: '/match/[id]/info', params: { id: matchId } });
  const toPad = () => router.dismissTo({ pathname: paths.pad, params: { id: matchId } });
  const leave = () => router.dismissTo({ pathname: '/match/[id]/info', params: { id: matchId } });
  return { push, replace, back, toPad, leave };
}
