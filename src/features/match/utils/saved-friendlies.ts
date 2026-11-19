export type ResumeMatch = { id: string; team_a_name: string; team_b_name: string; created_at: string; created_by?: string | null };
export type Assignment = { match_id: string; user_id: string };

export function resumableFriendlies(owned: ResumeMatch[], assigned: ResumeMatch[], assignments: Assignment[], userId: string): ResumeMatch[] {
  const eligible = owned.filter((match) => !assignments.some((row) => row.match_id === match.id && row.user_id !== userId));
  return [...new Map([...eligible, ...assigned].map((match) => [match.id, match])).values()]
    .sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 20);
}

/** Only the person who created a match may delete it; a scorer assigned to it may not. */
export const canDeleteSaved = (match: ResumeMatch, userId: string): boolean => match.created_by === userId;
