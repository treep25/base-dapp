import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { parseEther } from 'viem';
import { TARGET_CHAIN } from '../config/wagmi';
import { getContractAddress, FLAPPY_LEADERBOARD_ABI } from '../config/contract';

const SKIN_JESSE_ID = 1n;
const JESSE_PRICE = '0.001';

interface ShopProps {
  isOpen: boolean;
  onClose: () => void;
  currentSkin: string;
  onSkinSelect: (skin: string) => void;
}

interface SkinItem {
  id: string;
  skinId: bigint;
  name: string;
  image: string;
  price?: string;
  isPremium?: boolean;
}

const SKINS: SkinItem[] = [
  { id: 'bird', skinId: 0n, name: 'Bird', image: '/assets/bird.png' },
  { id: 'jesse', skinId: SKIN_JESSE_ID, name: 'Jesse', image: '/assets/jesse-logo.png', price: JESSE_PRICE, isPremium: true },
  { id: 'skin3', skinId: 0n, name: '???', image: '' },
  { id: 'skin4', skinId: 0n, name: '???', image: '' },
  { id: 'skin5', skinId: 0n, name: '???', image: '' },
  { id: 'skin6', skinId: 0n, name: '???', image: '' },
];

export function Shop({ isOpen, onClose, currentSkin, onSkinSelect }: ShopProps) {
  const [selectedSkin, setSelectedSkin] = useState(currentSkin);
  const [buyingSkin, setBuyingSkin] = useState<string | null>(null);
  const [justPurchased, setJustPurchased] = useState(false);
  
  const { isConnected, chain, address } = useAccount();
  const contractAddress = getContractAddress(TARGET_CHAIN.id);
  const queryClient = useQueryClient();
  
  const { data: hasJesseSkin, refetch: refetchSkin } = useReadContract({
    address: contractAddress,
    abi: FLAPPY_LEADERBOARD_ABI,
    functionName: 'hasSkin',
    args: address ? [address, SKIN_JESSE_ID] : undefined,
    query: { 
      enabled: !!address && !!contractAddress,
      gcTime: 0,
      staleTime: 0,
    },
  });
  
  useEffect(() => {
    if (isOpen && address && contractAddress) {
      refetchSkin();
      setJustPurchased(false);
    }
  }, [isOpen, address, contractAddress, refetchSkin]);

  const { writeContract, data: txHash, isPending, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isOnCorrectChain = chain?.id === TARGET_CHAIN.id;
  const ownsJesse = hasJesseSkin === true;

  useEffect(() => {
    if (isSuccess && buyingSkin) {
      const updateSkin = async () => {
        await queryClient.invalidateQueries();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await refetchSkin();
        setJustPurchased(true);
        setBuyingSkin(null);
        reset();
      };
      updateSkin();
    }
  }, [isSuccess, buyingSkin, refetchSkin, reset, queryClient]);

  if (!isOpen) return null;

  const isUnlocked = (skin: SkinItem) => {
    if (skin.id === 'bird') return true;
    if (skin.id === 'jesse') return ownsJesse;
    return false;
  };

  const handleSelect = (skin: SkinItem) => {
    if (isUnlocked(skin)) {
      setSelectedSkin(skin.id);
      onSkinSelect(skin.id);
    }
  };

  const handleBuy = (skin: SkinItem) => {
    if (!skin.price || !isConnected || !isOnCorrectChain || !contractAddress) return;
    
    setBuyingSkin(skin.id);
    writeContract({
      address: contractAddress,
      abi: FLAPPY_LEADERBOARD_ABI,
      functionName: 'buySkin',
      args: [skin.skinId],
      value: parseEther(skin.price),
    });
  };

  const isBuying = isPending || isConfirming;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop">
      <div 
        className="bg-gray-900/95 rounded-3xl p-6 w-full max-w-sm mx-4 border border-blue-500/20"
        style={{ boxShadow: '0 0 60px rgba(0, 82, 255, 0.3)' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShopIcon />
            SHOP
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Bird Skins</h3>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {SKINS.map((skin) => {
            const unlocked = isUnlocked(skin);
            const isSelected = selectedSkin === skin.id;
            const isEmpty = !skin.image;
            const isBuyingThis = buyingSkin === skin.id && isBuying;

            return (
              <button
                key={skin.id}
                onClick={() => handleSelect(skin)}
                disabled={!unlocked || isBuying}
                className={`
                  relative aspect-square rounded-xl p-2 transition-all
                  ${isEmpty 
                    ? 'bg-gray-800/50 border-2 border-dashed border-gray-700 cursor-default' 
                    : unlocked 
                      ? isSelected
                        ? 'bg-blue-600/30 border-2 border-blue-500 shadow-lg shadow-blue-500/30'
                        : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                      : 'bg-gray-800/50 border-2 border-gray-700/50 cursor-default'
                  }
                `}
              >
                {isEmpty ? (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-2xl text-gray-600">?</span>
                  </div>
                ) : (
                  <>
                    <img
                      src={skin.image}
                      alt={skin.name}
                      className={`w-full h-full object-contain ${!unlocked ? 'grayscale opacity-50' : ''}`}
                    />
                    {!unlocked && skin.isPremium && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        {isBuyingThis ? (
                          <div className="w-6 h-6 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                        ) : (
                          <LockIcon />
                        )}
                      </div>
                    )}
                    {isSelected && unlocked && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <CheckIcon />
                      </div>
                    )}
                  </>
                )}
                
                <div className="absolute -bottom-5 left-0 right-0 text-center">
                  <span className="text-[10px] text-gray-500 font-medium">{skin.name}</span>
                </div>
              </button>
            );
          })}
        </div>

        {SKINS.filter(s => s.isPremium && !isUnlocked(s)).map(skin => (
          <div 
            key={skin.id}
            className="mt-4 p-4 rounded-2xl border border-orange-500/30 
                       bg-gradient-to-br from-orange-500/10 to-yellow-500/5
                       animate-pulse"
            style={{ boxShadow: '0 0 30px rgba(255, 165, 0, 0.15)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-gray-800/80 p-2 border border-orange-500/20">
                <img src={skin.image} alt={skin.name} className="w-full h-full object-contain" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white mb-1">{skin.name} Skin</h4>
                <p className="text-xs text-gray-400 mb-2">Unlock forever</p>
                
                {!isConnected ? (
                  <div className="text-xs text-yellow-400">Connect wallet to buy</div>
                ) : !isOnCorrectChain ? (
                  <div className="text-xs text-red-400">Switch to Base Sepolia first!</div>
                ) : (
                  <button
                    onClick={() => handleBuy(skin)}
                    disabled={isBuying}
                    className="w-full py-2.5 rounded-xl font-bold text-sm
                               bg-gradient-to-r from-orange-500 to-yellow-500
                               text-black shadow-lg shadow-orange-500/30
                               hover:shadow-orange-500/50 hover:scale-[1.02]
                               active:scale-100 transition-all duration-200
                               disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                  >
                    {isBuying && buyingSkin === skin.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        <span>{isConfirming ? 'Confirming...' : 'Confirm in wallet'}</span>
                      </>
                    ) : (
                      <>
                        <EthIcon />
                        <span>Buy for {skin.price} ETH</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {justPurchased && (
          <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-center
                          animate-bounce">
            <span className="text-green-400 text-sm font-medium">✓ Unlocked</span>
          </div>
        )}

        <div className="mt-4 text-center">
          <span className="text-xs text-gray-500 font-medium">More skins coming soon...</span>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 rounded-xl font-bold text-base
                     bg-blue-600 hover:bg-blue-500 text-white
                     transition-all duration-200 active:scale-[0.98]"
        >
          Play
        </button>
      </div>
    </div>
  );
}

function ShopIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFA500" strokeWidth="2">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EthIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 320 512" fill="currentColor">
      <path d="M311.9 260.8L160 353.6 8 260.8 160 0l151.9 260.8zM160 383.4L8 290.6 160 512l152-221.4-152 92.8z"/>
    </svg>
  );
}
