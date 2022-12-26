export interface Game {
  name: string;
  slug: string;
  participants: Array<Participant>;
  gameState: GameState;
  votingScheme: Array<number>;
}

export interface Participant {
  name: string;
  id: string;
}

export interface VotingScheme {
  name: string;
  scheme: Array<number>;
}

export const FIBONACCI_VOTE_SCHEME: VotingScheme = {
  name: 'Fibonacci',
  scheme: [0, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]
};
export const EXTENDED_FIBONACCI_VOTE_SCHEME: VotingScheme = {
  name: 'Extended Fibonacci',
  scheme: [0, 0.25, 0.5, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, -1]
};

export type GamePhase = 'VOTING' | 'REVEALED';

export interface GameState {
  phase: GamePhase;
  votesByParticipantId: {[key:string]:Vote};
  lastTransition: string
}

export interface Vote {
  voted: boolean;
  vote?: number | undefined;
}
