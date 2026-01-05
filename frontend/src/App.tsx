import { useState, useCallback } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { wagmiConfig } from './config/wagmi';
import { GameContainer } from './components/GameContainer';
import { WalletButton } from './components/WalletButton';
import { Leaderboard } from './components/Leaderboard';
import { SubmitScore } from './components/SubmitScore';
import { Shop } from './components/Shop';
import { usePlayerScore } from './hooks/useLeaderboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      retry: 2,
    },
  },
});

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <GameApp />
      </QueryClientProvider>
    </WagmiProvider>
  );
}

function GameApp() {
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [isShopOpen, setIsShopOpen] = useState(false);
  
  const [lastScore, setLastScore] = useState(0);
  const [, setCurrentScore] = useState(0);
  
  const { score: currentHighScore } = usePlayerScore();
  const isNewRecord = lastScore > 0 && (currentHighScore === undefined || lastScore > currentHighScore);
  
  const [currentSkin, setCurrentSkin] = useState('bird');
  const [isJesseMode, setIsJesseMode] = useState(false);

  const handleGameOver = useCallback((score: number) => {
    setLastScore(score);
    setCurrentScore(score);
    setIsJesseMode(false);
  }, []);

  const handleScoreUpdate = useCallback((score: number) => {
    setCurrentScore(score);
    
    const JESSE_MODE_START = 20;
    const JESSE_MODE_END = 25;
    
    if (score >= JESSE_MODE_START && score < JESSE_MODE_END) {
      setIsJesseMode(true);
    } else if (score >= JESSE_MODE_END) {
      setIsJesseMode(false);
    }
  }, []);

  const handleSubmitRequest = useCallback((score: number) => {
    setLastScore(score);
    setIsSubmitOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0B0D] flex flex-col"
         style={{ paddingTop: 'var(--safe-top)', paddingBottom: 'var(--safe-bottom)' }}>
      <header className="fixed top-0 left-0 right-0 z-40 px-4"
              style={{ paddingTop: 'calc(var(--safe-top) + 8px)', height: 'calc(var(--header-height) + var(--safe-top))' }}>
        <div className="max-w-lg mx-auto flex items-center justify-between h-full">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4FC3F7] to-[#0288D1] 
                          flex items-center justify-center shadow-md overflow-hidden">
              <img src="/assets/bird.png" alt="Bird" className="w-7 h-7 object-contain" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">
              <span className="text-white">Base</span>
              <span className="text-[#0052FF]">Bird</span>
            </h1>
          </div>
          <WalletButton />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-3"
            style={{ paddingTop: 'calc(var(--header-height) + var(--safe-top) + 8px)', 
                     paddingBottom: 'calc(var(--footer-height) + var(--safe-bottom) + 8px)' }}>
        <GameContainer
          onGameOver={handleGameOver}
          onScoreUpdate={handleScoreUpdate}
          onSubmitScoreRequest={handleSubmitRequest}
          selectedSkin={currentSkin}
          isJesseMode={isJesseMode}
        />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 px-4"
           style={{ bottom: '50px' }}>
        <div className="max-w-lg mx-auto flex flex-col items-center gap-3">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setIsLeaderboardOpen(true)}
              className="flex-1 max-w-[140px] btn-secondary flex items-center justify-center gap-1.5 py-2.5 min-h-[40px]"
            >
              <TrophyIcon />
              <span className="text-xs font-medium">Leaderboard</span>
            </button>

            <button
              onClick={() => setIsShopOpen(true)}
              className="flex-1 max-w-[100px] btn-secondary flex items-center justify-center gap-1.5 py-2.5 min-h-[40px]"
            >
              <ShopIcon />
              <span className="text-xs font-medium">Shop</span>
            </button>

            {isNewRecord && (
              <button
                onClick={() => setIsSubmitOpen(true)}
                className="flex-1 max-w-[100px] btn-primary flex items-center justify-center gap-1.5 py-2.5 min-h-[40px]"
              >
                <UploadIcon />
                <span className="text-xs font-medium">Submit</span>
              </button>
            )}
          </div>
          
          <a 
            href="https://x.com/treeepy03" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-gray-500 hover:text-white transition-colors"
          >
            <XIcon />
            <span className="text-xs font-medium">g6.base.eth</span>
          </a>
        </div>
      </nav>

      <Leaderboard
        isOpen={isLeaderboardOpen}
        onClose={() => setIsLeaderboardOpen(false)}
      />

      <SubmitScore
        isOpen={isSubmitOpen}
        onClose={() => setIsSubmitOpen(false)}
        score={lastScore}
      />

      <Shop
        isOpen={isShopOpen}
        onClose={() => setIsShopOpen(false)}
        currentSkin={currentSkin}
        onSkinSelect={setCurrentSkin}
      />

    </div>
  );
}

function TrophyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export default App;
