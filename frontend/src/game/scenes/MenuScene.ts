import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, GAME_EVENTS } from '../config';

/**
 * MenuScene - Beautiful start screen for Flappy Base
 * 
 * Senior-level design with:
 * - Smooth sprite graphics
 * - Elegant typography
 * - Soft animations
 * - Base ecosystem branding
 */
export class MenuScene extends Phaser.Scene {
  private bird!: Phaser.GameObjects.Sprite;
  private background!: Phaser.GameObjects.Image;
  private logo!: Phaser.GameObjects.Image;
  private floatTween!: Phaser.Tweens.Tween;

  constructor() {
    super({ key: 'MenuScene' });
  }

  preload(): void {
    // Load all game assets with proper paths
    this.load.image('background', '/assets/background.png');
    this.load.image('bird', '/assets/bird.png');
    this.load.image('pipe-top', '/assets/pipe-top.png');
    this.load.image('pipe-bottom', '/assets/pipe-bottom.png');
    this.load.image('base-logo', '/assets/base-logo.png');
  }

  create(): void {
    // === BACKGROUND ===
    // Beautiful sky background stretched to fill
    this.background = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'background');
    const bgScale = Math.max(GAME_WIDTH / 1024, GAME_HEIGHT / 1536);
    this.background.setScale(bgScale);
    this.background.setDepth(0);

    // === DECORATIVE ELEMENTS ===
    this.createSoftParticles();

    // === BASE LOGO ===
    // Positioned elegantly in the upper area
    this.logo = this.add.image(GAME_WIDTH / 2, 75, 'base-logo');
    this.logo.setScale(0.08); // Scale down from 1536x1024
    this.logo.setDepth(50);
    this.logo.setAlpha(0.95);
    
    // Subtle glow pulse on logo
    this.tweens.add({
      targets: this.logo,
      alpha: 0.8,
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // === TITLE ===
    const titleStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
      fontSize: '36px',
      fontStyle: 'bold',
      color: '#FFFFFF',
      stroke: '#0052FF',
      strokeThickness: 4,
    };

    const title = this.add.text(GAME_WIDTH / 2, 140, 'FLAPPY BASE', titleStyle);
    title.setOrigin(0.5);
    title.setDepth(100);
    // Soft shadow for depth
    title.setShadow(0, 2, 'rgba(0, 0, 0, 0.3)', 4, true, true);

    // === BIRD ===
    // Positioned center with elegant floating animation
    this.bird = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 10, 'bird');
    this.bird.setDepth(10);
    // Scale: bird is 300x200, target display ~60px wide
    this.bird.setScale(60 / 300);

    // Smooth floating animation
    this.floatTween = this.tweens.add({
      targets: this.bird,
      y: this.bird.y - 12,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Gentle rotation
    this.tweens.add({
      targets: this.bird,
      angle: 5,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // === TAP TO PLAY BUTTON ===
    this.createPlayButton();

    // === FOOTER BRANDING ===
    const footer = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 25, 'Built on Base', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '11px',
      color: '#FFFFFF',
    });
    footer.setOrigin(0.5);
    footer.setAlpha(0.5);
    footer.setDepth(100);

    // === INPUT ===
    this.input.on('pointerdown', this.startGame, this);
    this.input.keyboard?.on('keydown-SPACE', this.startGame, this);
  }

  private createSoftParticles(): void {
    // Soft, subtle floating particles for visual interest
    const colors = [0xFFFFFF, 0xE3F2FD, 0xBBDEFB, 0x90CAF9, 0xFFE082];

    for (let i = 0; i < 8; i++) {
      const graphics = this.add.graphics();
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Phaser.Math.Between(4, 8);
      const x = Phaser.Math.Between(30, GAME_WIDTH - 30);
      const y = Phaser.Math.Between(180, GAME_HEIGHT - 120);

      // Soft rounded squares with transparency
      graphics.fillStyle(color, 0.4);
      graphics.fillRoundedRect(0, 0, size, size, size / 3);
      graphics.setPosition(x, y);
      graphics.setDepth(2);

      // Gentle floating animation
      this.tweens.add({
        targets: graphics,
        y: graphics.y - Phaser.Math.Between(20, 40),
        alpha: 0.15,
        duration: Phaser.Math.Between(5000, 9000),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Phaser.Math.Between(0, 3000),
      });
    }
  }

  private createPlayButton(): void {
    const btnY = GAME_HEIGHT - 100;
    const btnWidth = 180;
    const btnHeight = 50;
    const btnX = (GAME_WIDTH - btnWidth) / 2;

    // Button background with soft gradient effect
    const btn = this.add.graphics();
    
    // Outer soft glow
    btn.fillStyle(0x0052FF, 0.2);
    btn.fillRoundedRect(btnX - 4, btnY - 4, btnWidth + 8, btnHeight + 8, 20);
    
    // Main button
    btn.fillStyle(0x0052FF, 0.9);
    btn.fillRoundedRect(btnX, btnY, btnWidth, btnHeight, 16);
    
    // Inner highlight for soft 3D effect
    btn.fillStyle(0x3385FF, 0.6);
    btn.fillRoundedRect(btnX + 3, btnY + 3, btnWidth - 6, btnHeight / 2 - 2, { tl: 13, tr: 13, bl: 0, br: 0 });
    
    btn.setDepth(90);

    // Button text
    const btnText = this.add.text(GAME_WIDTH / 2, btnY + btnHeight / 2, 'TAP TO PLAY', {
      fontFamily: 'Inter, -apple-system, sans-serif',
      fontSize: '16px',
      fontStyle: 'bold',
      color: '#FFFFFF',
    });
    btnText.setOrigin(0.5);
    btnText.setDepth(91);

    // Subtle pulse animation on button
    this.tweens.add({
      targets: [btn, btnText],
      scaleX: 1.02,
      scaleY: 1.02,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  private startGame(): void {
    this.floatTween.stop();
    this.game.events.emit(GAME_EVENTS.GAME_START);
    this.scene.start('GameScene');
  }
}
