/**
 * useSubmitScore Hook
 * 
 * Handles submitting game scores to the on-chain leaderboard.
 * Manages transaction states and provides user feedback.
 */

import { useCallback, useState } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { FLAPPY_LEADERBOARD_ABI, getContractAddress } from '../config/contract';
import { getExplorerUrl } from '../config/wagmi';

export type SubmitStatus = 'idle' | 'pending' | 'confirming' | 'success' | 'error';

interface UseSubmitScoreReturn {
  // Submit function
  submitScore: (score: number) => Promise<void>;
  // Current status
  status: SubmitStatus;
  // Transaction hash (if available)
  txHash: string | undefined;
  // Error message (if any)
  error: string | undefined;
  // Block explorer URL
  explorerUrl: string | undefined;
  // Reset state
  reset: () => void;
  // Is wallet connected
  isConnected: boolean;
}

export function useSubmitScore(): UseSubmitScoreReturn {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  // Get contract address for current chain
  const contractAddress = getContractAddress(chainId);

  // Write contract hook
  const {
    writeContractAsync,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Wait for transaction receipt
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Update status based on transaction state
  if (isConfirming && status !== 'confirming') {
    setStatus('confirming');
  }
  if (isSuccess && status !== 'success') {
    setStatus('success');
  }

  /**
   * Submit score to the blockchain
   */
  const submitScore = useCallback(async (score: number) => {
    // Validation
    if (!isConnected) {
      setErrorMessage('Wallet not connected');
      setStatus('error');
      return;
    }

    if (!contractAddress) {
      setErrorMessage('Contract not deployed on this network');
      setStatus('error');
      return;
    }

    if (score <= 0) {
      setErrorMessage('Score must be greater than 0');
      setStatus('error');
      return;
    }

    try {
      setStatus('pending');
      setErrorMessage(undefined);

      // Send transaction
      await writeContractAsync({
        address: contractAddress,
        abi: FLAPPY_LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [BigInt(score)],
      });

      // Status will be updated by the effect watching txHash
    } catch (err) {
      console.error('Submit score error:', err);
      
      // Parse error message
      let message = 'Transaction failed';
      if (err instanceof Error) {
        if (err.message.includes('ScoreNotHigher')) {
          message = 'Your current high score is already higher!';
        } else if (err.message.includes('User rejected')) {
          message = 'Transaction cancelled';
        } else if (err.message.includes('insufficient funds')) {
          message = 'Insufficient ETH for gas';
        } else {
          message = err.message.slice(0, 100);
        }
      }
      
      setErrorMessage(message);
      setStatus('error');
    }
  }, [isConnected, contractAddress, writeContractAsync]);

  /**
   * Reset hook state
   */
  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(undefined);
    resetWrite();
  }, [resetWrite]);

  // Get explorer URL for the transaction
  const explorerUrl = txHash && chainId ? getExplorerUrl(chainId, txHash) : undefined;

  return {
    submitScore,
    status,
    txHash,
    error: errorMessage || (writeError ? writeError.message : undefined),
    explorerUrl,
    reset,
    isConnected,
  };
}

