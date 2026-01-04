import { useCallback, useState } from 'react';
import {
  useAccount,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
} from 'wagmi';
import { FLAPPY_LEADERBOARD_ABI, getContractAddress } from '../config/contract';
import { getExplorerUrl } from '../config/wagmi';

export type SubmitStatus = 'idle' | 'signing' | 'pending' | 'confirming' | 'success' | 'error';

interface SignatureResponse {
  signature: string;
  timestamp: number;
  nonce: string;
  expiresAt: number;
}

interface UseSubmitScoreReturn {
  submitScore: (score: number) => Promise<void>;
  status: SubmitStatus;
  txHash: string | undefined;
  error: string | undefined;
  explorerUrl: string | undefined;
  reset: () => void;
  isConnected: boolean;
}

const API_URL = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:3001/api/sign-score'
  : '/api/sign-score';

export function useSubmitScore(): UseSubmitScoreReturn {
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>();

  const contractAddress = getContractAddress(chainId);

  const {
    writeContractAsync,
    data: txHash,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  if (isConfirming && status !== 'confirming') {
    setStatus('confirming');
  }
  if (isSuccess && status !== 'success') {
    setStatus('success');
  }

  const submitScore = useCallback(async (score: number) => {
    if (!isConnected || !address) {
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

    if (score > 9999) {
      setErrorMessage('Score exceeds maximum allowed');
      setStatus('error');
      return;
    }

    try {
      setStatus('signing');
      setErrorMessage(undefined);

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address, score }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to get signature');
      }

      const { signature, timestamp, nonce }: SignatureResponse = await response.json();

      setStatus('pending');

      await writeContractAsync({
        address: contractAddress,
        abi: FLAPPY_LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [BigInt(score), BigInt(timestamp), nonce as `0x${string}`, signature as `0x${string}`],
      });
    } catch (err) {
      console.error('Submit score error:', err);
      
      let message = 'Transaction failed';
      if (err instanceof Error) {
        if (err.message.includes('ScoreNotHigher')) {
          message = 'Your current high score is already higher!';
        } else if (err.message.includes('User rejected')) {
          message = 'Transaction cancelled';
        } else if (err.message.includes('insufficient funds')) {
          message = 'Insufficient ETH for gas';
        } else if (err.message.includes('InvalidSignature')) {
          message = 'Invalid signature - please try again';
        } else if (err.message.includes('SignatureExpired')) {
          message = 'Signature expired - please try again';
        } else if (err.message.includes('Failed to get signature')) {
          message = 'Could not verify score - please try again';
        } else {
          message = err.message.slice(0, 100);
        }
      }
      
      setErrorMessage(message);
      setStatus('error');
    }
  }, [isConnected, address, contractAddress, writeContractAsync]);

  const reset = useCallback(() => {
    setStatus('idle');
    setErrorMessage(undefined);
    resetWrite();
  }, [resetWrite]);

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
