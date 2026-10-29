import { matchInfo } from '../sample-info';
import { innings, liveSnapshot, matchHeader } from '../sample-match';
import { oversData } from '../sample-overs';
import { wagonBatters } from '../sample-wagon';
import type { LiveMatchViewData } from './live-view';

/** The design-file match, shown when no saved or staged match has this id. */
export function sampleLiveView(): LiveMatchViewData {
  return {
    source: 'sample',
    header: { label: matchHeader.label, title: matchHeader.title, subtitle: matchHeader.subtitle, status: 'live', toss: null },
    sides: liveSnapshot.sides,
    summary: liveSnapshot.target,
    currentRunRate: liveSnapshot.currentRunRate,
    requiredRunRate: liveSnapshot.requiredRunRate,
    crease: { batters: liveSnapshot.batters, partnership: liveSnapshot.partnership, bowler: liveSnapshot.bowler },
    recentOvers: oversData.overs,
    wagonBatters,
    innings,
    overs: [oversData],
    info: matchInfo,
    stream: { label: liveSnapshot.streamLabel, source: liveSnapshot.streamSource },
  };
}
