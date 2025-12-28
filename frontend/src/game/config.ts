import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { GameOverScene } from './scenes/GameOverScene';

/**
 * Phaser Game Configuration
 * 
 * Optimized for mobile-first Mini App experience
 * with touch controls and responsive scaling.
 */

// Game dimensions - optimized for mobile portrait mode
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 480;

// Game physics constants - tuned for floaty, airy feel
export const GRAVITY = 450;           // Reduced for lighter feel
export const JUMP_VELOCITY = -250;    // Gentler jump
export const PIPE_SPEED = 160;        // Slightly slower pipes
export const PIPE_SPAWN_INTERVAL = 1800; // More time between pipes
export const PIPE_GAP = 140;          // Wider gap for easier gameplay

// Bird constants - smoother rotation
export const BIRD_X = 80;
export const BIRD_ROTATION_SPEED = 2;  // Slower rotation
export const BIRD_MAX_ROTATION = 20;   // Less extreme tilt
export const BIRD_MIN_ROTATION = -15;

/**
 * Creates Phaser game configuration
 * @param parent - HTML element ID or element to mount the game
 */
export function createGameConfig(parent: string | HTMLElement): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    parent,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    backgroundColor: '#87CEEB', // Sky blue gradient base
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: GRAVITY },
        debug: false, // Set to true for collision debugging
      },
    },
    scene: [MenuScene, GameScene, GameOverScene],
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: false, // Smooth modern graphics
      antialias: true,  // Enable anti-aliasing for smooth edges
      roundPixels: false,
    },
    input: {
      activePointers: 1, // Single touch for mobile
    },
    // Disable audio for now (can be added later)
    audio: {
      noAudio: true,
    },
  };
}

// Event names for game-to-React communication
export const GAME_EVENTS = {
  GAME_OVER: 'game-over',
  SCORE_UPDATE: 'score-update',
  GAME_START: 'game-start',
  GAME_RESTART: 'game-restart',
} as const;

