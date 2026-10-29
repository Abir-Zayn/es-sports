import { appLink } from '@/lib/share';

export { shareText } from '@/lib/share';

/** Opens the guest's profile, ready to claim. */
export function claimLink(token: string): string {
  return appLink(`claim/${encodeURIComponent(token)}`);
}

export function guestInviteMessage(a: { ownerName: string; teamName: string; tournamentName: string; token: string }): string {
  return `${a.ownerName} added you to the ${a.teamName} squad for ${a.tournamentName}! Check match updates and claim your player profile: ${claimLink(a.token)}`;
}

export function ownerInviteMessage(a: { fromName: string; teamName: string; tournamentName: string }): string {
  return `${a.fromName} invited you to own ${a.teamName} in ${a.tournamentName} on esSports. Open your invitations to accept: ${appLink('invitations')}`;
}
