import { useEffect } from 'react';
import { useSubmitScore } from '../hooks/useSubmitScore';
import { usePlayerScore } from '../hooks/useLeaderboard';
import { useAccount } from 'wagmi';

interface SubmitScoreProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
}

export function SubmitScore({ isOpen, onClose, score }: SubmitScoreProps) {
  const { isConnected } = useAccount();
  const { submitScore, status, txHash, error, explorerUrl, reset } = useSubmitScore();
  const { score: currentHighScore, refetch: refetchScore } = usePlayerScore();

  useEffect(() => {
    if (isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  useEffect(() => {
    if (status === 'success') {
      refetchScore();
    }
  }, [status, refetchScore]);

  if (!isOpen) return null;

  const canSubmit = isConnected && score > 0 && (currentHighScore === undefined || score > currentHighScore);
  const isNewHighScore = currentHighScore !== undefined && score > currentHighScore;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 modal-backdrop"
        onClick={status === 'idle' || status === 'error' ? onClose : undefined}
      />

      <div className="relative w-full max-w-sm overflow-hidden fade-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#0052FF]/20 via-[#00D4FF]/10 to-[#0052FF]/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-[#0A0B0D]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <ChainIcon />
              Submit Score
            </h2>
            {(status === 'idle' || status === 'error' || status === 'success') && (
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            )}
          </div>

          <div className="p-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray-500 font-medium mb-2">Your Score</div>
              <div className="text-5xl font-bold text-[#00D4FF] mb-3 text-glow-cyan">{score}</div>
              {currentHighScore !== undefined && currentHighScore > 0 && (
                <div className="text-xs text-gray-500 font-medium">
                  Current on-chain best: <span className="text-white">{currentHighScore}</span>
                </div>
              )}
              {isNewHighScore && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 
                              bg-gradient-to-r from-green-500/20 to-emerald-500/10 
                              border border-green-500/30 rounded-full 
                              text-green-400 text-xs font-medium">
                  <span>✨</span>
                  <span>New High Score!</span>
                </div>
              )}
            </div>

            {renderStatus()}

            {status === 'idle' && (
              <div className="space-y-3">
                {!isConnected ? (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#0052FF]/10 flex items-center justify-center">
                      <WalletIcon />
                    </div>
                    <div className="text-sm text-gray-400 font-medium">
                      Connect your wallet to submit scores
                    </div>
                  </div>
                ) : !canSubmit && currentHighScore !== undefined && score <= currentHighScore ? (
                  <div className="text-center py-4 px-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                    <div className="text-sm text-yellow-400 font-medium">
                      Score must be higher than your current best ({currentHighScore})
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => submitScore(score)}
                    disabled={!canSubmit}
                    className="w-full py-3.5 rounded-xl font-semibold text-white
                             bg-gradient-to-r from-[#0052FF] to-[#0066FF]
                             shadow-lg shadow-[#0052FF]/25 
                             hover:shadow-[#0052FF]/40 hover:scale-[1.02]
                             active:scale-100 transition-all duration-200
                             disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Submit to Blockchain
                  </button>
                )}
                
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-medium text-gray-400
                           bg-white/5 border border-white/10
                           hover:bg-white/10 hover:text-white
                           transition-all duration-200"
                >
                  Maybe Later
                </button>
              </div>
            )}

            {status === 'error' && (
              <div className="space-y-3">
                <button
                  onClick={() => submitScore(score)}
                  className="w-full py-3.5 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-[#0052FF] to-[#0066FF]
                           shadow-lg shadow-[#0052FF]/25 
                           hover:shadow-[#0052FF]/40 transition-all duration-200"
                >
                  Try Again
                </button>
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-medium text-gray-400
                           bg-white/5 border border-white/10
                           hover:bg-white/10 hover:text-white
                           transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            )}

            {status === 'success' && (
              <div className="space-y-3">
                {explorerUrl && (
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 rounded-xl font-medium text-[#0052FF]
                             bg-[#0052FF]/10 border border-[#0052FF]/30
                             hover:bg-[#0052FF]/20
                             flex items-center justify-center gap-2
                             transition-all duration-200"
                  >
                    View on BaseScan
                    <ExternalLinkIcon />
                  </a>
                )}
                <button
                  onClick={onClose}
                  className="w-full py-3.5 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-[#0052FF] to-[#0066FF]
                           shadow-lg shadow-[#0052FF]/25 
                           transition-all duration-200"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  function renderStatus() {
    switch (status) {
      case 'pending':
        return (
          <div className="flex flex-col items-center py-6 mb-4">
            <div className="spinner mb-4" />
            <div className="text-white font-medium">Waiting for signature...</div>
            <div className="text-gray-500 text-sm mt-1">
              Confirm in your wallet
            </div>
          </div>
        );

      case 'confirming':
        return (
          <div className="flex flex-col items-center py-6 mb-4">
            <div className="spinner mb-4" />
            <div className="text-white font-medium">Confirming transaction...</div>
            {txHash && (
              <div className="text-gray-500 text-xs mt-2 font-mono">
                Tx: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center py-6 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/10 
                          flex items-center justify-center mb-4 border border-green-500/30">
              <CheckIcon />
            </div>
            <div className="text-green-400 font-semibold">Score Submitted!</div>
            <div className="text-gray-500 text-sm mt-1">
              Your score is now on-chain
            </div>
          </div>
        );

      case 'error':
        return (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="text-red-400 font-medium mb-1">Transaction Failed</div>
            <div className="text-red-400/70 text-sm">{error}</div>
          </div>
        );

      default:
        return null;
    }
  }
}

function ChainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0052FF" strokeWidth="2">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
