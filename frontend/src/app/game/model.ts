export interface Game {
  name: string;
  slug: string;
  participants: Array<Participant>;
  gameState: GameState;
  votingScheme: VotingScheme;
}

export interface Participant {
  name: string;
  id: string;
}

export interface VotingScheme {
  name: string;
  scheme: Array<number>;
  includesQuestionmark: boolean;
}

export type GamePhase = 'VOTING' | 'REVEALED';

export interface GameState {
  phase: GamePhase;
  votesByParticipantId: {[key:string]:Vote};
  lastTransition: string
}

export type VoteOption = number | '?' | undefined;
export interface Vote {
  voted: boolean;
  vote?: VoteOption;
}
