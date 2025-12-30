import { useEffect, useRef, useCallback, useState } from 'react';
import { Application, Sprite, Container, Texture, Assets, TextureSource } from 'pixi.js';

const CONFIG = {
  width: 320,
  height: 480,
  groundHeight: 80,

  bird: {
    width: 58,
    height: 38,
    startX: 80,
    hitboxPadding: 10,
  },

  pipe: {
    width: 90,
    hitboxWidth: 50,
    hitboxPadding: 20,
    extension: 100,
    spawnInterval: 2200,
  },

  physics: {
    gravity: 0.28,
    jumpVelocity: -7.0,
    pipeSpeed: 3.2,
    hardModeMultiplier: 1.3,
    deathGravity: 0.5,
    deathRotationSpeed: 0.3,
  },

  difficulty: {
    gapMin: 100,
    gapMax: 145,
    gapHard: 85,
    hardModeScore: 20,
  },

  dayNight: {
    cycleInterval: 15,
    dayTint: 0xFFFFFF,
    sunsetTint: 0xFFCC88,
    nightTint: 0x6688AA,
  },

  messages: [
    "DO NOT STOP BASEPOSTING!!",
    "MORE 🔥",
    "BE BASED 💎",
  ],

  sounds: {
    jump: 600,
    score: 800,
    die: 200,
  },
} as const;

type GameState = 'menu' | 'ready' | 'playing' | 'dying' | 'gameover';

const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playSound = (frequency: number, duration: number = 0.1, type: OscillatorType = 'square') => {
  if (!audioContext) return;
  
  try {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  } catch {
    // Ignore audio errors
  }
};

const playJumpSound = () => playSound(CONFIG.sounds.jump, 0.08, 'sine');
const playScoreSound = () => {
  playSound(CONFIG.sounds.score, 0.1, 'sine');
  setTimeout(() => playSound(CONFIG.sounds.score * 1.25, 0.1, 'sine'), 50);
};
const playDieSound = () => {
  playSound(CONFIG.sounds.die, 0.3, 'sawtooth');
};

interface GameProps {
  onScoreUpdate?: (score: number) => void;
  onGameOver?: (score: number) => void;
  onGameStart?: () => void;
  selectedSkin?: string;
  isJesseMode?: boolean;
}

interface PipeData {
  top: Sprite;
  bottom: Sprite;
  scored: boolean;
  x: number;
  gap: number;
  gapY: number;
}

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function PixiGame({ onScoreUpdate, onGameOver, onGameStart, selectedSkin = 'bird', isJesseMode = false }: GameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);
  const birdRef = useRef<Sprite | null>(null);
  const backgroundRef = useRef<Sprite | null>(null);
  const pipesRef = useRef<PipeData[]>([]);
  const pipeContainerRef = useRef<Container | null>(null);
  const velocityRef = useRef(0);
  const scoreRef = useRef(0);
  const lastPipeSpawnRef = useRef(0);
  const gameStateRef = useRef<GameState>('menu');
  const mountedRef = useRef(true);
  const popupTimeoutRef = useRef<number | null>(null);
  const currentTintRef = useRef<number>(CONFIG.dayNight.dayTint);
  const wasJesseModeRef = useRef(false);

  const [gameState, setGameState] = useState<GameState>('menu');
  const [score, setScore] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const [birdScreenPos, setBirdScreenPos] = useState({ x: 0, y: 0 });
  const [isShaking, setIsShaking] = useState(false);
  const [showJesseFlash, setShowJesseFlash] = useState(false);

  useEffect(() => { gameStateRef.current = gameState; }, [gameState]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  
  useEffect(() => {
    if (birdRef.current && gameStateRef.current === 'menu') {
      birdRef.current.texture = Texture.from(selectedSkin);
    }
  }, [selectedSkin]);

  useEffect(() => {
    if (isJesseMode && birdRef.current) {
      wasJesseModeRef.current = true;
      birdRef.current.texture = Texture.from('jesse');
      
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      
      setShowJesseFlash(true);
      setTimeout(() => setShowJesseFlash(false), 300);
      
      setPopupMessage("🔥 JESSE MODE! 🔥");
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = window.setTimeout(() => setPopupMessage(null), 2000);
      
      playSound(400, 0.15, 'square');
      setTimeout(() => playSound(600, 0.15, 'square'), 100);
      setTimeout(() => playSound(800, 0.2, 'sine'), 200);
      
    } else if (!isJesseMode && wasJesseModeRef.current && birdRef.current) {
      wasJesseModeRef.current = false;
      birdRef.current.texture = Texture.from(selectedSkin);
      
      if (selectedSkin !== 'jesse') {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 300);
        
        setPopupMessage("BACK TO NORMAL!");
        if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
        popupTimeoutRef.current = window.setTimeout(() => setPopupMessage(null), 1500);
        
        playSound(600, 0.1, 'sine');
        setTimeout(() => playSound(400, 0.1, 'sine'), 80);
      }
    }
  }, [isJesseMode, selectedSkin]);

  const calculateScale = useCallback(() => {
    const maxWidth = Math.min(window.innerWidth - 32, CONFIG.width);
    const maxHeight = window.innerHeight - 200;
    const scaleX = maxWidth / CONFIG.width;
    const scaleY = maxHeight / CONFIG.height;
    return Math.min(scaleX, scaleY, 1);
  }, []);

  useEffect(() => {
    const handleResize = () => setScale(calculateScale());
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateScale]);

  useEffect(() => {
    mountedRef.current = true;
    if (!containerRef.current) return;

    TextureSource.defaultOptions.scaleMode = 'linear';
    const app = new Application();

    const initApp = async () => {
      try {
        await app.init({
          width: CONFIG.width,
          height: CONFIG.height,
          backgroundColor: 0x87CEEB,
          antialias: false,
          resolution: window.devicePixelRatio || 2,
          autoDensity: true,
        });

        if (!mountedRef.current || !containerRef.current) {
          app.destroy();
          return;
        }

        containerRef.current.appendChild(app.canvas);
        appRef.current = app;

        await Assets.load([
          { alias: 'background', src: '/assets/background.png' },
          { alias: 'bird', src: '/assets/bird.png' },
          { alias: 'jesse', src: '/assets/jesse-logo.png' },
          { alias: 'pipeTop', src: '/assets/pipe-top.png' },
          { alias: 'pipeBottom', src: '/assets/pipe-bottom.png' },
        ]);

        if (!mountedRef.current) return;

        createGameObjects(app);
        setIsLoaded(true);
        app.ticker.add(updateGame);
      } catch (e) {
        console.error('PixiJS init error:', e);
      }
    };

    initApp();

    return () => {
      mountedRef.current = false;
      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      if (appRef.current) {
        appRef.current.destroy(true, { children: true });
        appRef.current = null;
      }
    };
  }, []);

  const createGameObjects = (app: Application) => {
    const { width, height } = CONFIG;

    const bg = Sprite.from('background');
    bg.width = width;
    bg.height = height;
    bg.tint = CONFIG.dayNight.dayTint;
    app.stage.addChild(bg);
    backgroundRef.current = bg;

    const pipeContainer = new Container();
    pipeContainer.zIndex = 5;
    app.stage.addChild(pipeContainer);
    pipeContainerRef.current = pipeContainer;

    const bird = Sprite.from(selectedSkin);
    bird.anchor.set(0.5);
    bird.width = CONFIG.bird.width;
    bird.height = CONFIG.bird.height;
    bird.position.set(CONFIG.bird.startX, height / 2 - 50);
    bird.zIndex = 15;
    app.stage.addChild(bird);
    birdRef.current = bird;

    app.stage.sortableChildren = true;
  };

  const spawnPipe = () => {
    if (!pipeContainerRef.current) return;

    const { width, height, groundHeight } = CONFIG;
    const { extension, width: pipeWidth } = CONFIG.pipe;
    const { gapMin, gapMax, gapHard, hardModeScore } = CONFIG.difficulty;

    const currentScore = scoreRef.current;
    const isHardMode = currentScore >= hardModeScore;

    const minGap = isHardMode ? gapHard : gapMin;
    const maxGap = isHardMode ? gapMin : gapMax;
    const pipeGap = minGap + Math.random() * (maxGap - minGap);

    const playableHeight = height - groundHeight;
    const minGapY = 50;
    const maxGapY = playableHeight - pipeGap - 50;
    const gapY = calculateGapPosition(minGapY, maxGapY);

    const pipeTop = Sprite.from('pipeTop');
    pipeTop.anchor.set(0.5, 0);
    pipeTop.width = pipeWidth;
    pipeTop.height = gapY + extension;
    pipeTop.position.set(width + pipeWidth / 2, -extension);

    const pipeBottom = Sprite.from('pipeBottom');
    pipeBottom.anchor.set(0.5, 0);
    pipeBottom.width = pipeWidth;
    const bottomY = gapY + pipeGap;
    pipeBottom.height = playableHeight - bottomY + extension;
    pipeBottom.position.set(width + pipeWidth / 2, bottomY);

    pipeContainerRef.current.addChild(pipeTop, pipeBottom);

    pipesRef.current.push({
      top: pipeTop,
      bottom: pipeBottom,
      scored: false,
      x: width + pipeWidth / 2,
      gap: pipeGap,
      gapY: gapY,
    });
  };

  const calculateGapPosition = (min: number, max: number): number => {
    const roll = Math.random();

    if (roll < 0.3) {
      const middleMin = (max - min) * 0.35 + min;
      const middleMax = (max - min) * 0.65 + min;
      return middleMin + Math.random() * (middleMax - middleMin);
    } else if (roll < 0.7) {
      return min + Math.random() * (max - min);
    } else {
      return Math.random() < 0.5
        ? min + Math.random() * 40
        : max - Math.random() * 40;
    }
  };

  const updateGame = () => {
    const bird = birdRef.current;
    if (!bird) return;

    const state = gameStateRef.current;
    const currentScore = scoreRef.current;

    const { pipeSpeed, hardModeMultiplier } = CONFIG.physics;
    const speedMultiplier = currentScore >= CONFIG.difficulty.hardModeScore ? hardModeMultiplier : 1;
    const speed = pipeSpeed * speedMultiplier;

    if (state === 'menu' || state === 'ready') {
      bird.y = CONFIG.height / 2 - 50 + Math.sin(Date.now() / 300) * 10;
      bird.rotation = 0;
      return;
    }

    if (state === 'dying') {
      velocityRef.current += CONFIG.physics.deathGravity;
      bird.y += velocityRef.current;
      bird.rotation += CONFIG.physics.deathRotationSpeed;
      
      if (bird.y > CONFIG.height - CONFIG.groundHeight) {
        bird.y = CONFIG.height - CONFIG.groundHeight;
        setGameState('gameover');
        onGameOver?.(scoreRef.current);
      }
      return;
    }

    if (state !== 'playing') return;

    velocityRef.current += CONFIG.physics.gravity;
    bird.y += velocityRef.current;

    const targetRotation = Math.min(Math.max(velocityRef.current * 0.08, -0.5), 1.2);
    bird.rotation += (targetRotation - bird.rotation) * 0.1;

    setBirdScreenPos({ x: bird.x, y: bird.y });

    const now = Date.now();
    if (now - lastPipeSpawnRef.current > CONFIG.pipe.spawnInterval) {
      spawnPipe();
      lastPipeSpawnRef.current = now;
    }

    updatePipes(bird, speed);

    const birdRadius = CONFIG.bird.height / 2 - CONFIG.bird.hitboxPadding;
    if (bird.y > CONFIG.height - CONFIG.groundHeight - birdRadius || bird.y < birdRadius) {
      triggerDeath();
    }
  };

  const updatePipes = (bird: Sprite, speed: number) => {
    const pipes = pipesRef.current;

    for (let i = pipes.length - 1; i >= 0; i--) {
      const pipe = pipes[i];

      pipe.x -= speed;
      pipe.top.x = pipe.x;
      pipe.bottom.x = pipe.x;

      if (!pipe.scored && pipe.x < bird.x) {
        pipe.scored = true;
        handleScore();
      }

      if (pipe.x < -CONFIG.pipe.width) {
        pipeContainerRef.current?.removeChild(pipe.top);
        pipeContainerRef.current?.removeChild(pipe.bottom);
        pipes.splice(i, 1);
        continue;
      }

      if (checkCollision(bird, pipe)) {
        triggerDeath();
        return;
      }
    }
  };

  const handleScore = () => {
    const newScore = scoreRef.current + 1;
    setScore(newScore);
    onScoreUpdate?.(newScore);
    playScoreSound();
    updateDayNightCycle(newScore);

    if (newScore % 5 === 0) {
      const msgIndex = (newScore / 5 - 1) % CONFIG.messages.length;
      setPopupMessage(CONFIG.messages[msgIndex]);

      if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
      popupTimeoutRef.current = window.setTimeout(() => {
        setPopupMessage(null);
      }, 1500);
    }
  };

  const checkCollision = (bird: Sprite, pipe: PipeData): boolean => {
    const { hitboxPadding } = CONFIG.bird;
    const { hitboxWidth, hitboxPadding: pipeHitboxPadding } = CONFIG.pipe;

    const birdBounds: Bounds = {
      x: bird.x - (CONFIG.bird.width / 2 - hitboxPadding),
      y: bird.y - (CONFIG.bird.height / 2 - hitboxPadding),
      width: CONFIG.bird.width - hitboxPadding * 2,
      height: CONFIG.bird.height - hitboxPadding * 2,
    };

    const topBounds: Bounds = {
      x: pipe.x - hitboxWidth / 2,
      y: 0,
      width: hitboxWidth,
      height: pipe.gapY - pipeHitboxPadding,
    };

    const bottomStart = pipe.gapY + pipe.gap + pipeHitboxPadding;
    const bottomBounds: Bounds = {
      x: pipe.x - hitboxWidth / 2,
      y: bottomStart,
      width: hitboxWidth,
      height: CONFIG.height - CONFIG.groundHeight - bottomStart,
    };

    return rectIntersect(birdBounds, topBounds) || rectIntersect(birdBounds, bottomBounds);
  };

  const rectIntersect = (a: Bounds, b: Bounds): boolean => {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
  };

  const updateDayNightCycle = (score: number) => {
    const { cycleInterval, dayTint, sunsetTint, nightTint } = CONFIG.dayNight;
    const cycle = Math.floor(score / cycleInterval) % 3;
    
    let targetTint: number;
    switch (cycle) {
      case 0: targetTint = dayTint; break;
      case 1: targetTint = sunsetTint; break;
      case 2: targetTint = nightTint; break;
      default: targetTint = dayTint;
    }

    if (backgroundRef.current && currentTintRef.current !== targetTint) {
      currentTintRef.current = targetTint;
      backgroundRef.current.tint = targetTint;
    }
  };

  const triggerDeath = () => {
    setGameState('dying');
    velocityRef.current = -5;
    playDieSound();
  };

  const resetGame = useCallback(() => {
    if (birdRef.current) {
      birdRef.current.y = CONFIG.height / 2 - 50;
      birdRef.current.rotation = 0;
      birdRef.current.texture = Texture.from(selectedSkin);
    }

    pipesRef.current.forEach((pipe) => {
      pipeContainerRef.current?.removeChild(pipe.top);
      pipeContainerRef.current?.removeChild(pipe.bottom);
    });
    pipesRef.current = [];

    if (backgroundRef.current) {
      backgroundRef.current.tint = CONFIG.dayNight.dayTint;
    }
    currentTintRef.current = CONFIG.dayNight.dayTint;

    velocityRef.current = 0;
    setScore(0);
    setGameState('menu');
  }, [selectedSkin]);

  const jump = useCallback(() => {
    const state = gameStateRef.current;

    if (state === 'menu') {
      setGameState('ready');
    } else if (state === 'ready') {
      setGameState('playing');
      velocityRef.current = CONFIG.physics.jumpVelocity;
      lastPipeSpawnRef.current = Date.now();
      playJumpSound();
      onGameStart?.();
    } else if (state === 'playing') {
      velocityRef.current = CONFIG.physics.jumpVelocity;
      playJumpSound();
    } else if (state === 'dying' || state === 'gameover') {
      resetGame();
    }
  }, [onGameStart, resetGame]);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window;
    let lastTap = 0;
    
    const doJump = () => {
      const now = Date.now();
      if (now - lastTap < 250) return;
      lastTap = now;
      jump();
    };
    
    const handleTouch = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      doJump();
    };
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        doJump();
      }
    };

    const container = containerRef.current;
    
    if (isTouchDevice) {
      container?.addEventListener('touchstart', handleTouch, { passive: false });
    } else {
      container?.addEventListener('click', handleTouch);
    }
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      container?.removeEventListener('touchstart', handleTouch);
      container?.removeEventListener('click', handleTouch);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [jump]);

  return (
    <div 
      className={`relative ${isShaking ? 'animate-shake' : ''}`}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: 'top center',
      }}
    >
      {showJesseFlash && (
        <div 
          className="absolute inset-0 z-50 pointer-events-none rounded-2xl"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, rgba(255,100,0,0.4) 100%)',
            animation: 'flash 0.3s ease-out',
          }}
        />
      )}

      <div
        ref={containerRef}
        className="game-container rounded-2xl overflow-hidden cursor-pointer"
        style={{
          width: CONFIG.width,
          height: CONFIG.height,
          boxShadow: isJesseMode 
            ? '0 4px 40px rgba(255, 165, 0, 0.5), 0 0 60px rgba(255, 100, 0, 0.3)' 
            : '0 4px 30px rgba(0, 82, 255, 0.25)',
          transition: 'box-shadow 0.3s ease',
        }}
      />

      {isLoaded && (
        <>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none">
            <img
              src="/assets/base-logo.png"
              alt="Base"
              className="w-8 h-8 object-contain drop-shadow-lg"
            />
          </div>

          {gameState === 'menu' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1
                className="text-3xl font-bold text-white mb-2 select-none"
                style={{
                  textShadow: '0 2px 10px rgba(0, 82, 255, 0.5), 0 0 30px rgba(0, 212, 255, 0.3)',
                }}
              >
                BASEBIRD
              </h1>
              <p className="text-sm text-white/80 mt-16 animate-pulse select-none">
                TAP TO START
              </p>
            </div>
          )}

          {gameState === 'ready' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p
                className="text-2xl font-bold text-white select-none"
                style={{ textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)' }}
              >
                GET READY
              </p>
              <p className="text-sm text-white/70 mt-4 select-none">TAP TO FLY</p>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <span
                className="text-5xl font-bold text-white tabular-nums select-none"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 82, 255, 0.4)',
                }}
              >
                {score}
              </span>
            </div>
          )}

          {popupMessage && gameState === 'playing' && (
            <div 
              className="absolute pointer-events-none z-50"
              style={{
                left: birdScreenPos.x + 50,
                top: birdScreenPos.y - 50,
              }}
            >
              <div className="speech-bubble">
                <span className="text-xs font-bold text-gray-900 whitespace-nowrap select-none">
                  {popupMessage}
                </span>
              </div>
            </div>
          )}

          {gameState === 'gameover' && (
            <div 
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm cursor-pointer"
              onClick={resetGame}
              onTouchStart={(e) => { e.preventDefault(); resetGame(); }}
            >
              <div
                className="bg-gray-900/90 rounded-2xl p-6 text-center border border-blue-500/30 select-none"
                style={{ boxShadow: '0 0 30px rgba(0, 82, 255, 0.3)' }}
              >
                <h2 className="text-2xl font-bold text-white mb-2">GAME OVER</h2>
                <p className="text-gray-400 text-sm">SCORE</p>
                <p
                  className="text-4xl font-bold text-cyan-400 my-2 tabular-nums"
                  style={{ textShadow: '0 0 15px rgba(0, 212, 255, 0.5)' }}
                >
                  {score}
                </p>
                <p className="text-xs text-gray-500 mt-4">TAP TO RESTART</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
