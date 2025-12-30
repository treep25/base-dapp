import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect, useChainId, useSwitchChain } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { getChainName, isSupportedChain } from '../config/wagmi';

export function WalletButton() {
  const { address, isConnected, isReconnecting } = useAccount();
  const { connect, connectors, error: connectError, reset, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const chainId = useChainId();
  const [showModal, setShowModal] = useState(false);
  
  const isLoading = isPending && !isReconnecting;

  useEffect(() => {
    if (isConnected && chainId && chainId !== baseSepolia.id) {
      switchChain({ chainId: baseSepolia.id });
    }
  }, [isConnected, chainId, switchChain]);

  const shortAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '';

  const chainName = chainId ? getChainName(chainId) : 'Unknown';
  const isSupported = isSupportedChain(chainId);

  const handleConnect = (connectorId: string) => {
    const connector = connectors.find(c => c.id === connectorId);
    if (connector) {
      reset();
      connect({ connector });
      setShowModal(false);
    }
  };

  if (!isConnected) {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm
                     bg-gradient-to-r from-[#0052FF] to-[#0066FF] text-white
                     shadow-lg shadow-[#0052FF]/20 hover:shadow-[#0052FF]/40
                     hover:scale-105 active:scale-100 transition-all duration-200
                     disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isLoading ? (
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

        {showModal && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop"
            onClick={() => setShowModal(false)}
          >
            <div 
              className="bg-gray-900/95 rounded-2xl p-6 w-full max-w-xs mx-4 border border-blue-500/20"
              onClick={e => e.stopPropagation()}
              style={{ boxShadow: '0 0 40px rgba(0, 82, 255, 0.3)' }}
            >
              <h3 className="text-lg font-bold text-white mb-4">Connect Wallet</h3>
              
              <div className="space-y-2">
                {connectors.map((connector) => (
                  <button
                    key={connector.id}
                    onClick={() => handleConnect(connector.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl
                               bg-gray-800 hover:bg-gray-700 border border-gray-700
                               hover:border-blue-500/50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                      {connector.id === 'coinbaseWalletSDK' ? '🔵' : '🦊'}
                    </div>
                    <span className="text-white font-medium">{connector.name}</span>
                  </button>
                ))}
              </div>

              {connectError && (
                <p className="mt-3 text-xs text-red-400 text-center">
                  {connectError.message}
                </p>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full mt-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isSupported ? (
        <div className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                        bg-green-500/10 text-green-400 border border-green-500/20">
          {chainName}
        </div>
      ) : (
        <button
          onClick={() => switchChain({ chainId: baseSepolia.id })}
          disabled={isSwitching}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-sm
                     bg-red-500/10 text-red-400 border border-red-500/20
                     hover:bg-red-500/20 transition-colors cursor-pointer"
        >
          {isSwitching ? 'Switching...' : 'Switch to Base Sepolia'}
        </button>
      )}

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

      {connectError && (
        <div className="absolute top-full mt-2 p-3 bg-red-500/10 border border-red-500/20 
                       rounded-xl text-xs text-red-400 backdrop-blur-sm">
          {connectError.message}
        </div>
      )}
    </div>
  );
}

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
