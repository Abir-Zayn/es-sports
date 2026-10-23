/** Strike rate to two decimals. */
export function strikeRate(runs: number, balls: number): string {
  return balls === 0 ? '0.00' : ((runs / balls) * 100).toFixed(2);
}

/** Cricket overs like "3.3" (three overs and three balls) as a ball count. */
export function oversToBalls(overs: string): number {
  const [whole, part = '0'] = overs.split('.');
  return Number(whole) * 6 + Number(part);
}

/** Runs per over, to two decimals. */
export function economy(runs: number, overs: string): string {
  const balls = oversToBalls(overs);
  return balls === 0 ? '0.00' : ((runs / balls) * 6).toFixed(2);
}
