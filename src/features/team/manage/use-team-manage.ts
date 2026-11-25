import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { cancelInvitation, sendTeamPlayerInvite } from '@/features/invitations';
import { useAuth } from '@/features/auth';

import {
  deleteTeam, fetchInviteTracker, inviteTrackerKey, registerTeam, setTeamLogo, transferOwnership, updateTeamDetails,
} from '../data/team-lifecycle';
import { canManage, removeTeamMember, setMemberAvailability, teamMembersKey } from '../data/team-management';
import { fetchTeam, fetchTeamMembers, myTeamsKey, teamKey, type Availability, type TeamMemberRecord } from '../data/team-repository';
import type { NewTeamInput } from '../data/team-rules';

/** The clock the re-invite countdowns read, ticking every 30 seconds. */
function useNow(stepMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), stepMs);
    return () => clearInterval(timer);
  }, [stepMs]);
  return now;
}

/** One team's member screen: its data, and every action the owner, an admin or a member can take on it. */
export function useTeamManage(id: string) {
  const router = useRouter();
  const client = useQueryClient();
  const meId = useAuth().session?.user.id ?? '';
  const now = useNow();
  const team = useQuery({ queryKey: teamKey(id), queryFn: () => fetchTeam(id), enabled: Boolean(id) });
  const members = useQuery({ queryKey: teamMembersKey(id), queryFn: () => fetchTeamMembers(id), enabled: Boolean(id) });
  const myRole = members.data?.find((m) => m.profileId === meId)?.role ?? null;
  const manager = canManage(myRole);
  const invites = useQuery({
    queryKey: inviteTrackerKey(id, meId), queryFn: () => fetchInviteTracker(id, meId), enabled: Boolean(id && meId) && manager,
  });

  const refresh = () => {
    for (const queryKey of [teamKey(id), teamMembersKey(id), inviteTrackerKey(id, meId), myTeamsKey(meId), ['team-directory']]) {
      void client.invalidateQueries({ queryKey });
    }
  };
  const leaveScreen = () => { refresh(); router.replace('/teams'); };
  const invite = useMutation({ mutationFn: (userId: string) => sendTeamPlayerInvite(id, userId), onSuccess: refresh });
  const cancel = useMutation({ mutationFn: (inviteId: string) => cancelInvitation(inviteId), onSuccess: refresh });
  const remove = useMutation({ mutationFn: (profileId: string) => removeTeamMember(id, profileId), onSuccess: refresh });
  const availability = useMutation({
    mutationFn: (a: { profileId: string; value: Availability }) => setMemberAvailability(id, a.profileId, a.value), onSuccess: refresh,
  });
  const register = useMutation({ mutationFn: () => registerTeam(id), onSuccess: refresh });
  const edit = useMutation({ mutationFn: (input: NewTeamInput) => updateTeamDetails(id, input), onSuccess: refresh });
  const logo = useMutation({ mutationFn: (uri: string) => setTeamLogo(id, uri, team.data?.logoUrl ?? null), onSuccess: refresh });
  // The server takes the player out of every tournament squad of this team too.
  const leave = useMutation({ mutationFn: () => removeTeamMember(id, meId), onSuccess: leaveScreen });
  const handOver = useMutation({
    mutationFn: async (member: TeamMemberRecord) => { await transferOwnership(id, member.profileId); await removeTeamMember(id, meId); },
    onSuccess: leaveScreen,
  });
  const removeTeam = useMutation({ mutationFn: () => deleteTeam(id, team.data?.logoUrl ?? null), onSuccess: leaveScreen });

  const busy = [invite, cancel, remove, availability, register, edit, logo, leave, handOver, removeTeam].some((m) => m.isPending);
  return {
    meId, now, team, members, invites, myRole, manager, busy,
    invite, cancel, remove, availability, register, edit, logo, leave, handOver, deleteTeam: removeTeam,
  };
}
