import { type Address } from 'viem';
import FlappyLeaderboardABI from '../abi/FlappyLeaderboard.json';

export const CONTRACT_ADDRESSES: Record<number, Address> = {
  8453: '0x0000000000000000000000000000000000000000' as Address,
  84532: '0x9e011102b72C772350AC970a579C297E5a3E4Daa' as Address,
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address,
};

export const FLAPPY_LEADERBOARD_ABI = FlappyLeaderboardABI.abi;

export function getContractAddress(chainId: number): Address | undefined {
  return CONTRACT_ADDRESSES[chainId];
}

export const flappyLeaderboardConfig = {
  abi: FLAPPY_LEADERBOARD_ABI,
} as const;
