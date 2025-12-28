/**
 * GameContainer Component
 * 
 * React wrapper for the Phaser game.
 * Handles game lifecycle and communication between Phaser and React.
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import Phaser from 'phaser';
import { createGameConfig, GAME_EVENTS } from '../game/config';

interface GameContainerProps {
  onGameOver?: (score: number) => void;
  onScoreUpdate?: (score: number) => void;
  onSubmitScoreRequest?: (score: number) => void;
}

export function GameContainer({
  onGameOver,
  onScoreUpdate,
  onSubmitScoreRequest,
}: GameContainerProps) {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Handle game over event
  const handleGameOver = useCallback((score: number) => {
    onGameOver?.(score);
  }, [onGameOver]);

  // Handle score update event
  const handleScoreUpdate = useCallback((score: number) => {
    onScoreUpdate?.(score);
  }, [onScoreUpdate]);

  // Handle submit score request from game
  const handleSubmitRequest = useCallback((score: number) => {
    onSubmitScoreRequest?.(score);
  }, [onSubmitScoreRequest]);

  // Initialize Phaser game
  useEffect(() => {
    if (!gameContainerRef.current || gameRef.current) return;

    // Create game config with container element
    const config = createGameConfig(gameContainerRef.current);
    
    // Create Phaser game instance
    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Set up event listeners
    game.events.on(GAME_EVENTS.GAME_OVER, handleGameOver);
    game.events.on(GAME_EVENTS.SCORE_UPDATE, handleScoreUpdate);
    game.events.on('submit-score-request', handleSubmitRequest);
    
    // Mark as loaded once ready
    game.events.once('ready', () => {
      setIsLoading(false);
    });
    
    // Fallback loading indicator
    setTimeout(() => setIsLoading(false), 500);

    // Cleanup on unmount
    return () => {
      if (gameRef.current) {
        gameRef.current.events.off(GAME_EVENTS.GAME_OVER, handleGameOver);
        gameRef.current.events.off(GAME_EVENTS.SCORE_UPDATE, handleScoreUpdate);
        gameRef.current.events.off('submit-score-request', handleSubmitRequest);
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [handleGameOver, handleScoreUpdate, handleSubmitRequest]);

  return (
    <div className="relative w-full h-full flex items-center justify-center game-container">
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-base-dark z-10">
          <div className="spinner mb-4" />
          <span className="font-game text-gray-400">Loading game...</span>
        </div>
      )}
      
      {/* Game canvas container */}
      <div 
        ref={gameContainerRef} 
        className="rounded-xl overflow-hidden shadow-2xl glow-blue"
        style={{ 
          maxWidth: '100%',
          maxHeight: '100%',
        }}
      />
    </div>
  );
}

