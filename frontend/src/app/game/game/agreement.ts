import {Vote} from "../model";


interface VotedValue {
  card: number;
  totalVotes: number;
}

export function calculateAgreement(votes: Array<Vote>): number | null {
  const totalVotes = votes.filter(vote => vote.voted && isVoteNumerical(vote)).length;
  const votedValues = countVotedValues(votes);
  if (votedValues.size === 0) {
    return null;
  } else if (votedValues.size === 1) {
    return 100;
  }

  const voteRatios = [...votedValues.entries()].map(entry => entry[1]/totalVotes);
  const voteRationsStandardDeviation = standardDeviation(voteRatios, true);

  return Math.round(Math.min(voteRationsStandardDeviation, 0.6) / (1 - 0.6) * 100);
}

export function isVoteNumerical(v: Vote): boolean {
  return v.vote != undefined && typeof v.vote == "number" && v.vote >= 0;
}

function countVotedValues(votes: Array<Vote>): Map<number, number> {
  const countedVotedValues = new Map<number, number>();
  votes.forEach(v => {
    if (v.voted && isVoteNumerical(v)) {
      const numericalVote = v.vote as number;
      if (!countedVotedValues.has(numericalVote)) {
        countedVotedValues.set(numericalVote, 0);
      }
      countedVotedValues.set(numericalVote, countedVotedValues.get(numericalVote)! + 1);
    }
  });
  return countedVotedValues;
}

function standardDeviation(arr: Array<number>, usePopulation = false): number {
  const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
  return Math.sqrt(
    arr
      .reduce((acc, val) => acc.concat((val - mean) ** 2), [] as Array<number>)
      .reduce((acc, val) => acc + val, 0) / (arr.length - (usePopulation ? 0 : 1))
  );
}
