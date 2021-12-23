import {Vote} from "../model";


interface VotedValue {
  card: number;
  totalVotes: number;
}

export function calculateAgreement(votes: Array<Vote>): number | null {
  const totalVotes = votes.filter(vote => vote.voted && vote.vote != undefined && vote.vote >= 0).length;
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

function countVotedValues(votes: Array<Vote>): Map<number, number> {
  const countedVotedValues = new Map<number, number>();
  votes.forEach(v => {
    if (v.voted && v.vote !== undefined && v.vote >= 0) {
      if (!countedVotedValues.has(v.vote)) {
        countedVotedValues.set(v.vote, 0);
      }
      countedVotedValues.set(v.vote, countedVotedValues.get(v.vote)! + 1);
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
