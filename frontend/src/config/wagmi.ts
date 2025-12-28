/**
 * Wagmi Configuration for Base Mini App
 * 
 * This configuration sets up:
 * - Base Sepolia (testnet) and Base Mainnet chains
 * - Coinbase Wallet connector (primary for Mini Apps)
 * - Injected wallet connector (MetaMask, etc.)
 * 
 * Base Mini Apps run inside the Base social app and connect
 * to the user's Smart Wallet via the wallet API.
 */

import { http, createConfig } from 'wagmi';
import { base, baseSepolia, hardhat } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

// App metadata for wallet connection
const APP_NAME = 'Flappy Bird Base';
const APP_LOGO_URL = 'https://base.org/favicon.ico'; // Replace with your app icon

/**
 * Wagmi configuration with Base chains
 */
export const wagmiConfig = createConfig({
  chains: [base, baseSepolia, hardhat],
  connectors: [
    // Coinbase Wallet - primary connector for Base Mini Apps
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL,
      // Enable Smart Wallet features
      preference: 'smartWalletOnly',
    }),
    // Injected wallets (MetaMask, etc.) for development
    injected(),
  ],
  transports: {
    // Base Mainnet RPC
    [base.id]: http('https://mainnet.base.org'),
    // Base Sepolia Testnet RPC
    [baseSepolia.id]: http('https://sepolia.base.org'),
    // Local Hardhat for development
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
});

// Export chain IDs for easy reference
export const CHAIN_IDS = {
  BASE_MAINNET: base.id,
  BASE_SEPOLIA: baseSepolia.id,
  HARDHAT: hardhat.id,
} as const;

// Default chain for the app (use testnet for development)
export const DEFAULT_CHAIN = baseSepolia;

/**
 * Helper to check if we're on a supported chain
 */
export function isSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) return false;
  return chainId === base.id || chainId === baseSepolia.id || chainId === hardhat.id;
}

/**
 * Get chain name for display
 */
export function getChainName(chainId: number): string {
  switch (chainId) {
    case base.id:
      return 'Base';
    case baseSepolia.id:
      return 'Base Sepolia';
    case hardhat.id:
      return 'Localhost';
    default:
      return 'Unknown';
  }
}

/**
 * Get block explorer URL for a transaction
 */
export function getExplorerUrl(chainId: number, txHash: string): string {
  switch (chainId) {
    case base.id:
      return `https://basescan.org/tx/${txHash}`;
    case baseSepolia.id:
      return `https://sepolia.basescan.org/tx/${txHash}`;
    default:
      return '';
  }
}

