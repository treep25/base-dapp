/**
 * useLeaderboard Hook
 * 
 * Fetches and manages leaderboard data from the on-chain contract.
 * Provides top scores and player-specific score information.
 */

import { useReadContract, useChainId, useAccount } from 'wagmi';
import { FLAPPY_LEADERBOARD_ABI, getContractAddress } from '../config/contract';
import { type Address } from 'viem';

// Leaderboard entry type
export interface LeaderboardEntry {
  address: string;
  shortAddress: string;
  score: number;
  rank: number;
}

interface UseLeaderboardReturn {
  // Top scores list
  leaderboard: LeaderboardEntry[];
  // Current player's score
  playerScore: number | undefined;
  // Current player's rank
  playerRank: number | undefined;
  // Total player count
  totalPlayers: number;
  // Loading state
  isLoading: boolean;
  // Error state
  error: Error | null;
  // Refetch function
  refetch: () => void;
}

// Number of top scores to fetch
const TOP_SCORES_LIMIT = 10;

/**
 * Shorten address for display
 */
function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const chainId = useChainId();
  const { address: playerAddress } = useAccount();
  
  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId);

  // Fetch top scores
  const {
    data: topScoresData,
    isLoading: isLoadingTopScores,
    error: topScoresError,
    refetch: refetchTopScores,
  } = useReadContract({
    address: contractAddress,
    abi: FLAPPY_LEADERBOARD_ABI,
    functionName: 'getTopScores',
    args: [BigInt(TOP_SCORES_LIMIT)],
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  });

  // Fetch player count
  const {
    data: playerCountData,
    isLoading: isLoadingPlayerCount,
    refetch: refetchPlayerCount,
  } = useReadContract({
    address: contractAddress,
    abi: FLAPPY_LEADERBOARD_ABI,
    functionName: 'getPlayerCount',
    query: {
      enabled: !!contractAddress,
      refetchInterval: 30000,
    },
  });

  // Fetch current player's score
  const {
    data: playerScoreData,
    isLoading: isLoadingPlayerScore,
    refetch: refetchPlayerScore,
  } = useReadContract({
    address: contractAddress,
    abi: FLAPPY_LEADERBOARD_ABI,
    functionName: 'getPlayerScore',
    args: playerAddress ? [playerAddress as Address] : undefined,
    query: {
      enabled: !!contractAddress && !!playerAddress,
      refetchInterval: 30000,
    },
  });

  // Parse leaderboard data
  const leaderboard: LeaderboardEntry[] = [];
  let playerRank: number | undefined;

  if (topScoresData) {
    const [addresses, scores] = topScoresData as [string[], bigint[]];
    
    addresses.forEach((address, index) => {
      const entry: LeaderboardEntry = {
        address,
        shortAddress: shortenAddress(address),
        score: Number(scores[index]),
        rank: index + 1,
      };
      leaderboard.push(entry);

      // Check if this is the current player
      if (playerAddress && address.toLowerCase() === playerAddress.toLowerCase()) {
        playerRank = index + 1;
      }
    });
  }

  // Parse player score
  const playerScore = playerScoreData !== undefined 
    ? Number(playerScoreData as bigint) 
    : undefined;

  // Parse total players
  const totalPlayers = playerCountData !== undefined 
    ? Number(playerCountData as bigint) 
    : 0;

  // Combined loading state
  const isLoading = isLoadingTopScores || isLoadingPlayerCount || isLoadingPlayerScore;

  // Combined error
  const error = topScoresError as Error | null;

  // Combined refetch
  const refetch = () => {
    refetchTopScores();
    refetchPlayerCount();
    refetchPlayerScore();
  };

  return {
    leaderboard,
    playerScore,
    playerRank,
    totalPlayers,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to get just the player's personal score
 */
export function usePlayerScore(): {
  score: number | undefined;
  isLoading: boolean;
  refetch: () => void;
} {
  const chainId = useChainId();
  const { address: playerAddress } = useAccount();
  const contractAddress = getContractAddress(chainId);

  const { data, isLoading, refetch } = useReadContract({
    address: contractAddress,
    abi: FLAPPY_LEADERBOARD_ABI,
    functionName: 'getPlayerScore',
    args: playerAddress ? [playerAddress as Address] : undefined,
    query: {
      enabled: !!contractAddress && !!playerAddress,
    },
  });

  return {
    score: data !== undefined ? Number(data as bigint) : undefined,
    isLoading,
    refetch,
  };
}

