import { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { useBaseAppContext } from '../hooks/useBaseAppContext';

interface ShareScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  score: number;
}

export function ShareScoreModal({ isOpen, onClose, score }: ShareScoreModalProps) {
  const { user } = useBaseAppContext();
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = user?.displayName || user?.username || 'Player';
  const avatar = user?.pfpUrl || '';

  if (!isOpen) return null;

  // Build image URL with all params
  const imageParams = new URLSearchParams({
    score: score.toString(),
    username: username,
  });
  if (avatar) {
    imageParams.set('avatar', avatar);
  }
  const imageUrl = `https://base-bird.vercel.app/api/score-image?${imageParams.toString()}`;

  const handleShare = async () => {
    setIsSharing(true);
    setError(null);
    
    try {
      const shareText = `I just scored ${score} in BaseBird! 🐦 Can you beat me?`;
      const gameUrl = 'https://base-bird.vercel.app';
      
      await sdk.actions.composeCast({
        text: shareText,
        embeds: [imageUrl, gameUrl],
      });
      
      onClose();
    } catch (err) {
      console.error('Share error:', err);
      setError('Could not open composer. Try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />

      <div className="relative w-full max-w-xs overflow-hidden fade-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#8B5CF6]/20 via-[#6366F1]/10 to-[#8B5CF6]/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-[#0A0B0D]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Share Score</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="p-4">
            <div className="relative rounded-xl overflow-hidden mb-4 border border-white/10">
              {/* Preview using actual API image */}
              <img 
                src={imageUrl} 
                alt="Score preview"
                className="w-full aspect-[1200/630] object-cover"
                onError={(e) => {
                  // Fallback to CSS preview if image fails
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              {/* Fallback CSS preview */}
              <div className="hidden w-full aspect-[1200/630] bg-gradient-to-b from-[#0a1628] via-[#1e3a5f] to-[#87ceeb] flex flex-col items-center justify-center relative">
                {avatar ? (
                  <img src={avatar} alt="" className="w-16 h-16 rounded-full border-2 border-white/40 mb-2 object-cover" />
                ) : (
                  <div className="text-5xl mb-2">🐦</div>
                )}
                <div className="text-white/80 text-sm font-medium">{username}</div>
                <div className="text-white text-4xl font-bold mt-1 drop-shadow-lg">{score}</div>
                <div className="text-white/50 text-xs mt-2 tracking-[0.3em] uppercase">High Score</div>
                <div className="absolute bottom-2 right-2 bg-black/50 px-2 py-1 rounded text-white/70 text-xs font-medium">
                  BaseBird
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-3 p-2 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <button
              onClick={handleShare}
              disabled={isSharing}
              className="w-full py-3 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-[#8B5CF6] to-[#6366F1]
                       shadow-lg shadow-purple-500/25 
                       hover:shadow-purple-500/40 hover:scale-[1.02]
                       active:scale-100 transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
            >
              {isSharing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Opening...</span>
                </>
              ) : (
                <>
                  <ShareIcon />
                  <span>Share</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 mt-2 rounded-xl font-medium text-gray-400 text-sm
                       hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
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

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}
