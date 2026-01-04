import { type Address } from 'viem';
import FlappyLeaderboardABI from '../abi/FlappyLeaderboard.json';
import { TARGET_CHAIN } from './wagmi';

export const CONTRACT_ADDRESSES: Record<number, Address> = {
  8453: '0x1e93b0AECB25971D8b35b25edd88F6671E31b45f' as Address,
  84532: '0x8dD7F5D62f5b48D4e074845055fe2ecd4f606a81' as Address,
};

export const FLAPPY_LEADERBOARD_ABI = FlappyLeaderboardABI as unknown as readonly unknown[];

export function getContractAddress(chainId: number): Address | undefined {
  if (chainId !== TARGET_CHAIN.id) return undefined;
  return CONTRACT_ADDRESSES[chainId];
}

export const flappyLeaderboardConfig = {
  abi: FLAPPY_LEADERBOARD_ABI,
} as const;
