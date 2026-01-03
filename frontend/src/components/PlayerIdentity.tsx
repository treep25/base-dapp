import { useEnsName, useEnsAvatar } from 'wagmi';
import { mainnet, base } from 'wagmi/chains';
import { useMemo } from 'react';
import { normalize } from 'viem/ens';

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
  });

  const { data: ensName, isLoading: ensLoading } = useEnsName({
    address: address as `0x${string}`,
    chainId: mainnet.id,
    query: {
      enabled: !baseName,
    },
  });

  const resolvedName = baseName || ensName;
  const isLoadingName = baseNameLoading || (!baseName && ensLoading);

  const { data: ensAvatar } = useEnsAvatar({
    name: resolvedName ? normalize(resolvedName) : undefined,
    chainId: baseName ? base.id : mainnet.id,
    universalResolverAddress: baseName ? '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD' : undefined,
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

  const gradientColors = useMemo(() => {
    const hash = address.toLowerCase().split('').reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    
    const h1 = Math.abs(hash) % 360;
    const h2 = (h1 + 40) % 360;
    
    return {
      from: `hsl(${h1}, 70%, 50%)`,
      to: `hsl(${h2}, 70%, 40%)`,
    };
  }, [address]);

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
          <div 
            className="w-full h-full flex items-center justify-center text-white font-bold"
            style={{
              background: `linear-gradient(135deg, ${gradientColors.from}, ${gradientColors.to})`,
              fontSize: size === 'sm' ? '10px' : size === 'md' ? '12px' : '14px',
            }}
          >
            {address.slice(2, 4).toUpperCase()}
          </div>
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
