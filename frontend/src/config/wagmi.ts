import { http, createConfig } from 'wagmi';
import { base } from 'wagmi/chains';
import { coinbaseWallet, injected } from 'wagmi/connectors';

const APP_NAME = 'BaseBird';
const APP_LOGO_URL = 'https://base.org/favicon.ico';

export const TARGET_CHAIN = base;

export const TARGET_CHAIN_CONFIG = {
  chainId: `0x${TARGET_CHAIN.id.toString(16)}`,
  chainName: TARGET_CHAIN.name,
  nativeCurrency: TARGET_CHAIN.nativeCurrency,
  rpcUrls: ['https://mainnet.base.org'],
  blockExplorerUrls: ['https://basescan.org'],
};

export const wagmiConfig = createConfig({
  chains: [base],
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
  },
  syncConnectedChain: false,
});

export const CHAIN_IDS = {
  BASE_MAINNET: base.id,
} as const;

export function isCorrectChain(chainId: number | undefined): boolean {
  return chainId === TARGET_CHAIN.id;
}

export function getChainName(chainId: number): string {
  if (chainId === base.id) {
    return 'Base';
  }
  return 'Wrong Network';
}

export function getExplorerUrl(chainId: number, txHash: string): string {
  if (chainId === base.id) {
    return `https://basescan.org/tx/${txHash}`;
  }
  return '';
}
