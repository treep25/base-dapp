import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_EVENTS } from '../config';

/**
 * GameOverScene - Elegant game over screen
 * 
 * Senior-level design:
 * - Soft glassmorphism panel
 * - Smooth animations
 * - Beautiful typography
 * - Soft button with hover effects
 */
export class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private highScore: number = 0;

  constructor() {
    super({ key: 'GameOverScene' });
  }

  init(data: { score: number }): void {
    this.score = data.score || 0;

    const savedHighScore = localStorage.getItem('flappybase-highscore');
    this.highScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('flappybase-highscore', this.highScore.toString());
    }
  }

  create(): void {
    // Background with soft overlay
    const bg = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
    const bgScale = Math.max(GAME_WIDTH / 1024, GAME_HEIGHT / 1536);
    bg.setScale(bgScale);
    bg.setDepth(0);

    // Dark overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.55);
    overlay.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    overlay.setDepth(1);

    // Panel
    this.createPanel();

    // Input
    this.input.on('pointerdown', this.restartGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.restartGame, this);
  }

  private createPanel(): void {
    const panelWidth = 250;
    const panelHeight = 280;
    const panelX = (GAME_WIDTH - panelWidth) / 2;
    const panelY = (GAME_HEIGHT - panelHeight) / 2 - 15;

    const panel = this.add.graphics();

    // Outer glow (soft)
    panel.fillStyle(0x0052FF, 0.25);
    panel.fillRoundedRect(panelX - 5, panelY - 5, panelWidth + 10, panelHeight + 10, 22);

    // Main panel
    panel.fillStyle(0x0A0B0D, 0.9);
    panel.fillRoundedRect(panelX, panelY, panelWidth, panelHeight, 18);

    // Subtle inner highlight
    panel.fillStyle(0x1a1b26, 0.5);
    panel.fillRoundedRect(panelX + 2, panelY + 2, panelWidth - 4, 45, { tl: 16, tr: 16, bl: 0, br: 0 });

    // Border
    panel.lineStyle(1.5, 0x0052FF, 0.4);
    panel.strokeRoundedRect(panelX, panelY, panelWidth, panelHeight, 18);

    panel.setDepth(10);

    // "GAME OVER"
    const gameOverText = this.add.text(GAME_WIDTH / 2, panelY + 30, 'GAME OVER', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '22px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    gameOverText.setOrigin(0.5);
    gameOverText.setDepth(11);

    // Score label
    const scoreLabel = this.add.text(GAME_WIDTH / 2, panelY + 70, 'SCORE', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '12px',
      fontStyle: 'bold',
      color: '#888888',
    });
    scoreLabel.setOrigin(0.5);
    scoreLabel.setDepth(11);

    // Score value with animation
    const scoreText = this.add.text(GAME_WIDTH / 2, panelY + 105, '0', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '48px',
      fontStyle: 'bold',
      color: '#00D4FF',
    });
    scoreText.setOrigin(0.5);
    scoreText.setDepth(11);
    scoreText.setShadow(0, 0, 'rgba(0, 82, 255, 0.5)', 12, true, true);

    // Animate score count
    this.tweens.addCounter({
      from: 0,
      to: this.score,
      duration: 700,
      ease: 'Power2',
      onUpdate: (tween) => {
        scoreText.setText(Math.round(tween.getValue()).toString());
      },
    });

    // Best label
    const bestLabel = this.add.text(GAME_WIDTH / 2, panelY + 150, 'BEST', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#666666',
    });
    bestLabel.setOrigin(0.5);
    bestLabel.setDepth(11);

    // Best value
    const bestText = this.add.text(GAME_WIDTH / 2, panelY + 175, this.highScore.toString(), {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '26px',
      fontStyle: 'bold',
      color: '#FFD700',
    });
    bestText.setOrigin(0.5);
    bestText.setDepth(11);

    // New best indicator
    if (this.score === this.highScore && this.score > 0) {
      const newBest = this.add.text(GAME_WIDTH / 2, panelY + 200, 'NEW BEST!', {
        fontFamily: 'Inter, -apple-system, sans-serif',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#FFD700',
      });
      newBest.setOrigin(0.5);
      newBest.setDepth(11);

      this.tweens.add({
        targets: newBest,
        scaleX: 1.1,
        scaleY: 1.1,
        duration: 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    }

    // Play Again button
    this.createSoftButton(panelX + 20, panelY + panelHeight - 60, panelWidth - 40, 44);

    // Hint
    const hint = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, 'TAP ANYWHERE TO RESTART', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '10px',
      color: '#FFFFFF',
    });
    hint.setOrigin(0.5);
    hint.setDepth(11);
    hint.setAlpha(0.45);

    this.tweens.add({
      targets: hint,
      alpha: 0.2,
      duration: 1000,
      yoyo: true,
      repeat: -1,
    });
  }

  private createSoftButton(x: number, y: number, width: number, height: number): void {
    const btn = this.add.graphics();

    // Soft glow
    btn.fillStyle(0x0052FF, 0.35);
    btn.fillRoundedRect(x - 3, y - 3, width + 6, height + 6, 15);

    // Main button
    btn.fillStyle(0x0052FF, 0.95);
    btn.fillRoundedRect(x, y, width, height, 12);

    // Highlight
    btn.fillStyle(0x3385FF, 0.5);
    btn.fillRoundedRect(x + 2, y + 2, width - 4, height / 2 - 1, { tl: 10, tr: 10, bl: 0, br: 0 });

    btn.setDepth(11);

    // Text
    const btnText = this.add.text(x + width / 2, y + height / 2, 'PLAY AGAIN', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '14px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(12);

    // Subtle pulse
    this.tweens.add({
      targets: btn,
      scaleX: 1.01,
      scaleY: 1.01,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private restartGame(): void {
    this.game.events.emit(GAME_EVENTS.GAME_RESTART);
    this.scene.start('GameScene');
  }
}
