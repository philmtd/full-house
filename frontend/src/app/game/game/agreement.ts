import {Vote} from "../model";

export function calculateAgreement(votes: Array<Vote>): number | null {
  const votedNumbers = votes.filter(vote => vote.voted && isVoteNumerical(vote));
  return calculateAgreementInternal(votedNumbers.map(v => v.vote as number))
}

function calculateAgreementInternal(numbers: number[]): number | null {
  if (numbers.length === 0) {
    return null;
  }
  const consensus: number = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
  const deviationsFromConsensus: number[] = numbers.map(num => Math.abs(num - consensus));
  const averageDeviation: number = deviationsFromConsensus.reduce((sum, deviation) => sum + deviation, 0) / deviationsFromConsensus.length;
  const votedValueRange: number = Math.max(...numbers) - Math.min(...numbers);
  const minMaxDeviationPercentage: number = 10;
  const maxDeviationScalingFactor: number = 5;
  const maxDeviationPercentage: number = Math.max(minMaxDeviationPercentage, 70 - (votedValueRange * maxDeviationScalingFactor));
  const maxDeviation: number = (maxDeviationPercentage / 100) * consensus;
  return Math.max(0, (1 - averageDeviation / maxDeviation) * 100);
}

export function isVoteNumerical(v: Vote): boolean {
  return v.vote != undefined && typeof v.vote == "number" && v.vote >= 0;
}
