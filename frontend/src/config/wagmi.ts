import { http, createConfig } from 'wagmi';
import { base, baseSepolia, hardhat } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const APP_NAME = 'BaseBird';
const APP_LOGO_URL = 'https://base.org/favicon.ico';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base, hardhat],
  connectors: [
    coinbaseWallet({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL,
      preference: 'all',
    }),
    injected(),
  ],
  transports: {
    [base.id]: http('https://mainnet.base.org'),
    [baseSepolia.id]: http('https://sepolia.base.org'),
    [hardhat.id]: http('http://127.0.0.1:8545'),
  },
  syncConnectedChain: false,
});

export const CHAIN_IDS = {
  BASE_MAINNET: base.id,
  BASE_SEPOLIA: baseSepolia.id,
  HARDHAT: hardhat.id,
} as const;

export const DEFAULT_CHAIN = baseSepolia;

export function isSupportedChain(chainId: number | undefined): boolean {
  if (!chainId) return false;
  return chainId === base.id || chainId === baseSepolia.id || chainId === hardhat.id;
}

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
