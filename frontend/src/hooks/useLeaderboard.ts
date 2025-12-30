import { useReadContract, useChainId, useAccount } from 'wagmi';
import { FLAPPY_LEADERBOARD_ABI, getContractAddress } from '../config/contract';
import { type Address } from 'viem';

export interface LeaderboardEntry {
  address: string;
  shortAddress: string;
  score: number;
  rank: number;
}

interface UseLeaderboardReturn {
  leaderboard: LeaderboardEntry[];
  playerScore: number | undefined;
  playerRank: number | undefined;
  totalPlayers: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const TOP_SCORES_LIMIT = 10;

function shortenAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function useLeaderboard(): UseLeaderboardReturn {
  const chainId = useChainId();
  const { address: playerAddress } = useAccount();
  const contractAddress = getContractAddress(chainId);

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
      refetchInterval: 30000,
    },
  });

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

      if (playerAddress && address.toLowerCase() === playerAddress.toLowerCase()) {
        playerRank = index + 1;
      }
    });
  }

  const playerScore = playerScoreData !== undefined 
    ? Number(playerScoreData as bigint) 
    : undefined;

  const totalPlayers = playerCountData !== undefined 
    ? Number(playerCountData as bigint) 
    : 0;

  const isLoading = isLoadingTopScores || isLoadingPlayerCount || isLoadingPlayerScore;
  const error = topScoresError as Error | null;

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
