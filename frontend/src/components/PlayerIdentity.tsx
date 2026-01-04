import { useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { useMemo } from 'react';
import { normalize } from 'viem/ens';
import { TARGET_CHAIN } from '../config/wagmi';

const IS_MAINNET = (TARGET_CHAIN.id as number) === base.id;

interface PlayerIdentityProps {
  address: string;
  isCurrentPlayer?: boolean;
  showAddress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  currentUserProfile?: {
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
}

export function PlayerIdentity({ 
  address, 
  isCurrentPlayer = false, 
  showAddress = false,
  size = 'md',
  currentUserProfile
}: PlayerIdentityProps) {
  const { data: baseName, isLoading: baseNameLoading } = useEnsName({
    address: address as `0x${string}`,
    chainId: base.id,
    universalResolverAddress: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
    query: {
      enabled: IS_MAINNET,
    },
  });

  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
    query: {
      enabled: IS_MAINNET && !baseName,
    },
  });

  const resolvedName = IS_MAINNET ? (baseName || ensName) : null;
  const isLoadingName = IS_MAINNET && (baseNameLoading || (!baseName && ensLoading));

  const { data: ensAvatar } = useEnsAvatar({
    name: resolvedName ? normalize(resolvedName) : undefined,
    chainId: baseName ? base.id : mainnet.id,
    universalResolverAddress: baseName ? '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' : undefined,
    query: {
      enabled: IS_MAINNET && !!resolvedName,
    },
  });

  const displayName = useMemo(() => {
    if (isCurrentPlayer && currentUserProfile?.displayName) {
      return currentUserProfile.displayName;
    }
    if (isCurrentPlayer && currentUserProfile?.username) {
      return currentUserProfile.username;
    }
    if (resolvedName) return resolvedName;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address, resolvedName, isCurrentPlayer, currentUserProfile]);

  const avatarUrl = useMemo(() => {
    if (isCurrentPlayer && currentUserProfile?.pfpUrl) {
      return currentUserProfile.pfpUrl;
    }
    return ensAvatar || null;
  }, [ensAvatar, isCurrentPlayer, currentUserProfile]);

  const avatarSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }[size];

  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <div className="flex items-center gap-2 min-w-0">
      <div className={`${avatarSize} rounded-full overflow-hidden flex-shrink-0 ring-2 ${
        isCurrentPlayer ? 'ring-[#00D4FF]/50' : 'ring-white/10'
      }`}>
        {avatarUrl ? (
          <img 
            src={avatarUrl} 
            alt={displayName}
            className="w-full h-full object-cover"
          />
        ) : (
          <DefaultAvatar size={size} />
        )}
      </div>
      
      <div className="min-w-0 flex-1">
        <div className={`font-medium truncate ${textSize} ${
          isCurrentPlayer 
            ? 'text-[#00D4FF]' 
            : resolvedName || (isCurrentPlayer && currentUserProfile)
              ? 'text-white' 
              : 'text-gray-300'
        }`}>
          {isLoadingName && !currentUserProfile ? (
            <span className="text-gray-500 animate-pulse">...</span>
          ) : (
            displayName
          )}
        </div>
        
        {showAddress && isCurrentPlayer && (
          <div className="text-[10px] text-gray-500 truncate">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultAvatar({ size }: { size: 'sm' | 'md' | 'lg' }) {
  const iconSize = {
    sm: 14,
    md: 18,
    lg: 22,
  }[size];

  return (
    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2"
        className="text-gray-400"
      >
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </div>
  );
}
