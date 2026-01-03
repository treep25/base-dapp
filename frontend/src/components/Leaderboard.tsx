import { useState } from 'react';
import { useLeaderboard, type LeaderboardEntry } from '../hooks/useLeaderboard';
import { useAccount } from 'wagmi';
import { PlayerIdentity } from './PlayerIdentity';
import { useBaseAppContext } from '../hooks/useBaseAppContext';

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

const ITEMS_PER_PAGE = 10;

export function Leaderboard({ isOpen, onClose }: LeaderboardProps) {
  const { leaderboard, playerScore, playerRank, totalPlayers, isLoading, refetch } = useLeaderboard();
  const { address, isConnected } = useAccount();
  const { user: baseAppUser } = useBaseAppContext();
  const [currentPage, setCurrentPage] = useState(0);

  if (!isOpen) return null;

  const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
  const paginatedLeaderboard = leaderboard.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 modal-backdrop"
        onClick={onClose}
      />

      <div className="relative w-full max-w-sm overflow-hidden fade-in">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#0052FF]/20 via-[#00D4FF]/10 to-[#0052FF]/20 rounded-2xl blur-xl" />
        
        <div className="relative bg-[#0A0B0D]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <TrophyIcon />
              Leaderboard
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <CloseIcon />
            </button>
          </div>

          {isConnected && playerScore !== undefined && playerScore > 0 && (
            <div className="px-5 py-4 bg-gradient-to-r from-[#0052FF]/10 to-transparent border-b border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-medium mb-1">Your Best</div>
                  <div className="text-2xl font-bold text-[#00D4FF]">{playerScore}</div>
                </div>
                {playerRank && (
                  <div className="text-right">
                    <div className="text-xs text-gray-500 font-medium mb-1">Rank</div>
                    <div className="text-2xl font-bold text-white">#{playerRank}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center py-8">
                <div className="spinner mb-4" />
                <span className="text-gray-400 text-sm font-medium">Loading scores...</span>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#0052FF]/10 flex items-center justify-center">
                  <span className="text-3xl">🎮</span>
                </div>
                <div className="text-gray-400 font-medium">No scores yet!</div>
                <div className="text-gray-600 text-sm mt-1">Be the first to play!</div>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedLeaderboard.map((entry) => {
                  const isCurrentPlayer = isConnected && address?.toLowerCase() === entry.address.toLowerCase();
                  return (
                    <LeaderboardRow
                      key={entry.address}
                      entry={entry}
                      isCurrentPlayer={isCurrentPlayer}
                      currentUserProfile={isCurrentPlayer ? baseAppUser : null}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed
                         bg-white/5 hover:bg-white/10 text-white"
              >
                ←
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`w-7 h-7 rounded-lg text-xs font-medium transition-all ${
                      currentPage === i 
                        ? 'bg-[#0052FF] text-white' 
                        : 'bg-white/5 hover:bg-white/10 text-gray-400'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                         disabled:opacity-30 disabled:cursor-not-allowed
                         bg-white/5 hover:bg-white/10 text-white"
              >
                →
              </button>
            </div>
          )}

          <div className="px-5 py-3 bg-[#1a1b26]/50 border-t border-white/5 flex items-center justify-between">
            <span className="text-xs text-gray-500 font-medium">
              {totalPlayers} player{totalPlayers !== 1 ? 's' : ''} total
            </span>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="text-xs text-[#0052FF] hover:text-[#00D4FF] font-medium 
                       flex items-center gap-1.5 transition-colors"
            >
              <RefreshIcon className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LeaderboardRow({
  entry,
  isCurrentPlayer,
  currentUserProfile,
}: {
  entry: LeaderboardEntry;
  isCurrentPlayer: boolean;
  currentUserProfile: { username?: string; displayName?: string; pfpUrl?: string } | null;
}) {
  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border-yellow-500/30 text-yellow-400';
      case 2:
        return 'bg-gradient-to-r from-gray-300/20 to-gray-400/10 border-gray-400/30 text-gray-300';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/30 text-amber-500';
      default:
        return 'bg-[#1a1b26]/50 border-transparent text-gray-400';
    }
  };

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
        isCurrentPlayer
          ? 'bg-gradient-to-r from-[#0052FF]/20 to-[#00D4FF]/10 border border-[#0052FF]/30 shadow-lg shadow-[#0052FF]/10'
          : 'hover:bg-white/5'
      }`}
    >
      <div
        className={`w-10 h-10 flex items-center justify-center rounded-xl font-bold text-sm border
          ${getRankStyle(entry.rank)}`}
      >
        {entry.rank <= 3 ? (
          <span className="text-lg">
            {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
          </span>
        ) : (
          entry.rank
        )}
      </div>

      <div className="flex-1 min-w-0">
        <PlayerIdentity 
          address={entry.address} 
          isCurrentPlayer={isCurrentPlayer}
          showAddress={isCurrentPlayer}
          size="md"
          currentUserProfile={currentUserProfile}
        />
      </div>

      <div className="text-xl font-bold text-[#00D4FF]">
        {entry.score}
      </div>
    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
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

function RefreshIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}
