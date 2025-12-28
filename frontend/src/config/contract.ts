/**
 * Contract Configuration
 * 
 * This file contains the deployed contract addresses and configuration
 * for the FlappyLeaderboard smart contract on Base network.
 * 
 * Update these addresses after deploying the contract!
 */

import { type Address } from 'viem';
import FlappyLeaderboardABI from '../abi/FlappyLeaderboard.json';

// Contract addresses for different networks
export const CONTRACT_ADDRESSES: Record<number, Address> = {
  // Base Mainnet (chainId: 8453)
  8453: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after mainnet deploy
  
  // Base Sepolia Testnet (chainId: 84532)
  84532: '0x0000000000000000000000000000000000000000' as Address, // TODO: Update after testnet deploy
  
  // Hardhat local (chainId: 31337)
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' as Address, // Default Hardhat first deployment address
};

// Export the ABI
export const FLAPPY_LEADERBOARD_ABI = FlappyLeaderboardABI.abi;

/**
 * Get contract address for a specific chain
 */
export function getContractAddress(chainId: number): Address | undefined {
  return CONTRACT_ADDRESSES[chainId];
}

/**
 * Contract configuration object for wagmi
 */
export const flappyLeaderboardConfig = {
  abi: FLAPPY_LEADERBOARD_ABI,
  // Address will be set based on connected chain
} as const;

