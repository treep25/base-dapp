import { useMemo } from 'react';

interface PlayerIdentityProps {
  address: string;
  isCurrentPlayer?: boolean;
  showAddress?: boolean;
  size?: 'sm' | 'md' | 'lg';
  farcasterProfile?: {
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
  isLoadingProfile?: boolean;
}

function generateColorFromAddress(address: string): { bg: string; accent: string } {
  const hash = address.toLowerCase().slice(2, 10);
  const num = parseInt(hash, 16);
  
  const hue1 = num % 360;
  const hue2 = (hue1 + 40) % 360;
  
  return {
    bg: `hsl(${hue1}, 70%, 45%)`,
    accent: `hsl(${hue2}, 80%, 60%)`,
  };
}

function generateInitials(address: string): string {
  return address.slice(2, 4).toUpperCase();
}

export function PlayerIdentity({ 
  address, 
  isCurrentPlayer = false, 
  showAddress = false,
  size = 'md',
  farcasterProfile,
  isLoadingProfile = false,
}: PlayerIdentityProps) {
  const colors = useMemo(() => generateColorFromAddress(address), [address]);
  const initials = useMemo(() => generateInitials(address), [address]);

  const displayName = useMemo(() => {
    if (farcasterProfile?.displayName) {
      return farcasterProfile.displayName;
    }
    if (farcasterProfile?.username) {
      return `@${farcasterProfile.username}`;
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }, [address, farcasterProfile]);

  const hasRealName = !!(farcasterProfile?.displayName || farcasterProfile?.username);
  const avatarUrl = farcasterProfile?.pfpUrl || null;

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

  const initialsSize = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
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
          <div 
            className="w-full h-full flex items-center justify-center font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${colors.bg} 0%, ${colors.accent} 100%)`,
            }}
          >
            <span className={initialsSize}>{initials}</span>
          </div>
        )}
      </div>
      
      <div className="min-w-0 flex-1">
        <div className={`font-medium truncate ${textSize} ${
          isCurrentPlayer 
            ? 'text-[#00D4FF]' 
            : hasRealName
              ? 'text-white' 
              : 'text-gray-300'
        }`}>
          {isLoadingProfile ? (
            <span className="text-gray-500 animate-pulse">Loading...</span>
          ) : (
            displayName
          )}
        </div>
        
        {showAddress && isCurrentPlayer && (
          <div className="text-[10px] text-gray-500 truncate font-mono">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        )}
      </div>
    </div>
  );
}
