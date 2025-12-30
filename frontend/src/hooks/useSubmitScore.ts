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
  submitScore: (score: number) => Promise<void>;
  status: SubmitStatus;
  txHash: string | undefined;
  error: string | undefined;
  explorerUrl: string | undefined;
  reset: () => void;
  isConnected: boolean;
}

export function useSubmitScore(): UseSubmitScoreReturn {
  const { isConnected } = useAccount();
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

      await writeContractAsync({
        address: contractAddress,
        abi: FLAPPY_LEADERBOARD_ABI,
        functionName: 'submitScore',
        args: [BigInt(score)],
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
        } else {
          message = err.message.slice(0, 100);
        }
      }
      
      setErrorMessage(message);
      setStatus('error');
    }
  }, [isConnected, contractAddress, writeContractAsync]);

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
