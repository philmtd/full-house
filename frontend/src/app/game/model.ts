export interface AdminSettings {
  allowOthersToReveal: boolean;
  allowOthersToRestart: boolean;
}

export interface Game {
  name: string;
  slug: string;
  creatorParticipantId: string;
  participants: Array<Participant>;
  gameState: GameState;
  votingScheme: VotingScheme;
  adminSettings: AdminSettings;
}

export interface Participant {
  name: string;
  id: string;
}

export interface SchemeTooltipMapping {
  value: number;
  tooltip: string;
}

export interface VotingScheme {
  name: string;
  scheme: Array<number>;
  labels?: Array<string>;
  includesQuestionmark: boolean;
  schemeTooltipMapping: Array<SchemeTooltipMapping>;
}

export type GamePhase = 'VOTING' | 'REVEALED';

export interface GameState {
  phase: GamePhase;
  votesByParticipantId: { [key: string]: Vote };
  lastTransition: string
}

export type VoteOption = number | '?' | undefined;

export interface Vote {
  voted: boolean;
  vote?: VoteOption;
}

export interface AppInfo {
  version: string;
}
