export type TeamInfo = { short: string; name: string; color: string };

export type LiveTeam = TeamInfo & {
  /** Display score, e.g. "142/4", or "Yet to bat". */
  score: string;
  /** Display overs, e.g. "(16.3)". Empty when there is nothing to show. */
  overs: string;
  /** True for the side currently batting. */
  batting: boolean;
};

export type LiveMatch = {
  id: string;
  /** Competition and match number, e.g. "HSF PREMIER LEAGUE · MATCH 12". */
  label: string;
  /** What the game needs now, e.g. "Strikers need 27 runs from 21 balls". */
  status: string;
  teams: [LiveTeam, LiveTeam];
  /** Outcome of each ball this over: "0".."6", "W", "Wd", "Nb". */
  balls: string[];
};
