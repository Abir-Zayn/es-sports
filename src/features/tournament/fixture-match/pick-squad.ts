/**
 * The playing XI from the whole squad: everyone when the squad fits, otherwise `limit` players drawn at random
 * (partial Fisher–Yates). The result keeps the squad's order so the list reads the same as the roster.
 */
export function pickSquad(ids: readonly string[], limit: number, random: () => number = Math.random): string[] {
  if (ids.length <= limit) return [...ids];
  const pool = [...ids];
  for (let i = 0; i < limit; i += 1) {
    const j = i + Math.floor(random() * (pool.length - i));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const chosen = new Set(pool.slice(0, Math.max(0, limit)));
  return ids.filter((id) => chosen.has(id));
}
