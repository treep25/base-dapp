import Phaser from 'phaser';
import { Bird } from '../objects/Bird';
import { PipeManager } from '../objects/Pipe';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  PIPE_SPAWN_INTERVAL,
  BIRD_X,
  GAME_EVENTS,
} from '../config';

/**
 * GameScene - Main gameplay with beautiful smooth graphics
 * 
 * Senior-level design:
 * - Smooth sprite animations
 * - Elegant UI with soft shadows
 * - Pleasant color palette
 */
export class GameScene extends Phaser.Scene {
  private bird!: Bird;
  private pipeManager!: PipeManager;
  private background!: Phaser.GameObjects.Image;
  private scoreText!: Phaser.GameObjects.Text;
  private score: number = 0;
  private isGameOver: boolean = false;
  private isGameStarted: boolean = false;
  private pipeTimer!: Phaser.Time.TimerEvent;
  private readyContainer!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    this.score = 0;
    this.isGameOver = false;
    this.isGameStarted = false;

    // === BACKGROUND ===
    this.background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
    const bgScale = Math.max(GAME_WIDTH / 1024, GAME_HEIGHT / 1536);
    this.background.setScale(bgScale);
    this.background.setDepth(0);

    // Soft particles
    this.createSoftParticles();

    // === BIRD ===
    this.bird = new Bird(this, GAME_HEIGHT / 2 - 30);

    // === PIPES ===
    this.pipeManager = new PipeManager(this);

    // === SCORE ===
    this.scoreText = this.add.text(GAME_WIDTH / 2, 45, '0', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '52px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0052FF',
      strokeThickness: 5,
    });
    this.scoreText.setOrigin(0.5);
    this.scoreText.setDepth(100);
    this.scoreText.setShadow(0, 2, 'rgba(0, 0, 0, 0.25)', 6, true, true);
    this.scoreText.setVisible(false);

    // === GET READY UI ===
    this.createReadyUI();

    // Floating bird before start
    this.tweens.add({
      targets: this.bird,
      y: this.bird.y - 12,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // === INPUT ===
    this.input.on('pointerdown', this.handleInput, this);
    this.input.keyboard?.on('keydown-SPACE', this.handleInput, this);
  }

  private createSoftParticles(): void {
    const colors = [0xFFFFFF, 0xE3F2FD, 0xBBDEFB, 0xFFE082, 0xF8BBD9];

    for (let i = 0; i < 6; i++) {
      const graphics = this.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(4, 7);
      const x = Phaser.Math.Between(20, GAME_WIDTH - 20);
      const y = Phaser.Math.Between(80, GAME_HEIGHT - 80);

      graphics.fillStyle(color, 0.35);
      graphics.fillRoundedRect(0, 0, size, size, size / 3);
      graphics.setPosition(x, y);
      graphics.setDepth(2);

      this.tweens.add({
        targets: graphics,
        y: graphics.y - Phaser.Math.Between(25, 45),
        alpha: 0.1,
        duration: Phaser.Math.Between(5000, 8000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }
  }

  private createReadyUI(): void {
    this.readyContainer = this.add.container(GAME_WIDTH / 2, 0);
    this.readyContainer.setDepth(100);

    // "GET READY" text
    const readyText = this.add.text(0, GAME_HEIGHT / 2 - 90, 'GET READY', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0052FF',
      strokeThickness: 3,
    });
    readyText.setOrigin(0.5);
    readyText.setShadow(0, 2, 'rgba(0, 0, 0, 0.2)', 4, true, true);

    // "TAP TO FLY" with soft styling
    const tapText = this.add.text(0, GAME_HEIGHT / 2 + 60, 'TAP TO FLY', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    tapText.setOrigin(0.5);
    tapText.setAlpha(0.8);

    // Pulse animation
    this.tweens.add({
      targets: tapText,
      alpha: 0.4,
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.readyContainer.add([readyText, tapText]);
  }

  private startGameplay(): void {
    this.isGameStarted = true;

    // Remove ready UI
    this.tweens.killTweensOf(this.bird);
    this.readyContainer.destroy();

    // Show score
    this.scoreText.setVisible(true);

    // Enable bird physics
    this.bird.startGame();
    this.bird.jump();

    // Start pipe spawning
    this.pipeTimer = this.time.addEvent({
      delay: PIPE_SPAWN_INTERVAL,
      callback: this.spawnPipe,
      callbackScope: this,
      loop: true,
    });

    // First pipe after delay
    this.time.delayedCall(1200, () => {
      if (!this.isGameOver) {
        this.spawnPipe();
      }
    });

    // Setup collisions
    this.setupCollisions();
  }

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.bird,
      this.pipeManager.getGroup(),
      this.handleCollision,
      undefined,
      this
    );
  }

  private spawnPipe(): void {
    if (this.isGameOver) return;
    this.pipeManager.spawnPipe(GAME_WIDTH + 50);
  }

  private handleInput(): void {
    if (this.isGameOver) return;

    if (!this.isGameStarted) {
      this.startGameplay();
      return;
    }

    this.bird.jump();
  }

  private handleCollision(): void {
    if (this.isGameOver) return;
    this.gameOver();
  }

  private gameOver(): void {
    this.isGameOver = true;

    if (this.pipeTimer) {
      this.pipeTimer.destroy();
    }

    this.bird.die();

    // Soft flash
    this.cameras.main.flash(150, 255, 255, 255, true);
    this.cameras.main.shake(150, 0.008);

    this.game.events.emit(GAME_EVENTS.GAME_OVER, this.score);

    this.time.delayedCall(1000, () => {
      this.scene.start('GameOverScene', { score: this.score });
    });
  }

  private checkScoring(): void {
    const birdX = this.bird.x;

    this.pipeManager.getPipes().forEach(pipe => {
      if (!pipe.hasScored() && birdX > pipe.x + 30) {
        pipe.markScored();
        this.incrementScore();
      }
    });
  }

  private incrementScore(): void {
    this.score += 1;
    this.scoreText.setText(this.score.toString());

    // Elegant popup
    const popup = this.add.text(BIRD_X + 25, this.bird.y - 25, '+1', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '20px',
      fontStyle: 'bold',
      color: '#00D4FF',
      stroke: '#FFFFFF',
      strokeThickness: 2,
    });
    popup.setOrigin(0.5);
    popup.setDepth(100);

    this.tweens.add({
      targets: popup,
      y: popup.y - 40,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 500,
      ease: 'Power2',
      onComplete: () => popup.destroy(),
    });

    this.game.events.emit(GAME_EVENTS.SCORE_UPDATE, this.score);
  }

  update(): void {
    if (!this.isGameStarted) return;

    if (this.isGameOver) {
      this.bird.updateRotation();
      return;
    }

    this.bird.updateRotation();
    this.pipeManager.update();
    this.checkScoring();

    if (this.bird.isOutOfBounds()) {
      this.gameOver();
    }

    // Ground collision
    if (this.bird.y > GAME_HEIGHT - 40) {
      this.gameOver();
    }
  }
}
