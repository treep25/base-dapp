/**
 * WalletButton Component
 * 
 * Modern wallet connection button with Base styling.
 * Glassmorphism design with glow effects.
 */

import { useAccount, useConnect, useDisconnect, useChainId } from 'wagmi';
import { getChainName, isSupportedChain } from '../config/wagmi';

export function WalletButton() {
  const { address, isConnected, isConnecting } = useAccount();
  const { connect, connectors, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();

  // Shorten address for display
  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  // Get chain info
  const chainName = chainId ? getChainName(chainId) : 'Unknown';
  const isSupported = isSupportedChain(chainId);

  // Handle connect
  const handleConnect = () => {
    const coinbaseConnector = connectors.find(c => c.id === 'coinbaseWalletSDK');
    const connector = coinbaseConnector || connectors[0];
    
    if (connector) {
      connect({ connector });
    }
  };

  // Not connected state
  if (!isConnected) {
    return (
      <button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                   bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white
                   shadow-lg shadow-[#0052FF]/20 hover:shadow-[#0052FF]/40
                   hover:scale-105 active:scale-100 transition-all duration-200
                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isConnecting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            <span>Connecting...</span>
          </>
        ) : (
          <>
            <WalletIcon />
            <span>Connect</span>
          </>
        )}
      </button>
    );
  }

  // Connected state
  return (
    <div className="flex items-center gap-2">
      {/* Network badge */}
      <div
        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
          ${isSupported
            ? 'bg-green-500/10 text-green-400 border border-green-500/20'
            : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}
      >
        {isSupported ? chainName : 'Wrong Network'}
      </div>

      {/* Address button */}
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 px-3 py-2 
                   bg-[#1a1b26]/80 hover:bg-[#1a1b26] 
                   backdrop-blur-sm rounded-xl 
                   border border-white/10 hover:border-[#0052FF]/50
                   transition-all duration-200 group"
      >
        <div className="w-2 h-2 rounded-full bg-green-400 shadow-sm shadow-green-400/50" />
        <span className="font-medium text-sm text-white">{shortAddress}</span>
        <DisconnectIcon className="opacity-50 group-hover:opacity-100 transition-opacity" />
      </button>

      {/* Error display */}
      {connectError && (
        <div className="absolute top-full mt-2 p-3 bg-red-500/10 border border-red-500/20 
                       rounded-xl text-xs text-red-400 backdrop-blur-sm">
          {connectError.message}
        </div>
      )}
    </div>
  );
}

// Wallet icon SVG
function WalletIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

// Disconnect icon SVG
function DisconnectIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`text-gray-400 ${className}`}
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
