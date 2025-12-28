import Phaser from 'phaser';
import {
  BIRD_X,
  JUMP_VELOCITY,
  BIRD_ROTATION_SPEED,
  BIRD_MAX_ROTATION,
  BIRD_MIN_ROTATION,
  GAME_HEIGHT,
} from '../config';

/**
 * Bird class - Smooth animated player character
 * 
 * Uses bird.png (300x200)
 * Features:
 * - Smooth anti-aliased graphics
 * - Floaty physics for pleasant gameplay
 * - Gentle rotation based on velocity
 */
export class Bird extends Phaser.Physics.Arcade.Sprite {
  private isAlive: boolean = true;

  // Target display size
  private static readonly TARGET_WIDTH = 45;

  constructor(scene: Phaser.Scene, y: number) {
    super(scene, BIRD_X, y, 'bird');

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(false);
    this.setGravityY(0);

    // Scale: original is 300 wide, target is 45px
    this.setScale(Bird.TARGET_WIDTH / 300);

    // Hitbox slightly smaller for fair gameplay
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setSize(this.width * 0.65, this.height * 0.65);
    body.setOffset(this.width * 0.175, this.height * 0.175);

    this.setDepth(10);
  }

  jump(): void {
    if (!this.isAlive) return;
    this.setVelocityY(JUMP_VELOCITY);
    this.setAngle(BIRD_MIN_ROTATION);
  }

  startGame(): void {
    this.setGravityY(450);
  }

  die(): void {
    this.isAlive = false;
  }

  updateRotation(): void {
    if (!this.isAlive) {
      if (this.angle < 90) {
        this.angle += BIRD_ROTATION_SPEED * 1.5;
      }
      return;
    }

    const velocity = this.body?.velocity.y ?? 0;

    if (velocity < 0) {
      if (this.angle > BIRD_MIN_ROTATION) {
        this.angle -= BIRD_ROTATION_SPEED;
      }
    } else {
      if (this.angle < BIRD_MAX_ROTATION) {
        this.angle += BIRD_ROTATION_SPEED * 0.4;
      }
    }
  }

  isOutOfBounds(): boolean {
    return this.y > GAME_HEIGHT + 50 || this.y < -50;
  }

  reset(y: number): void {
    this.isAlive = true;
    this.setPosition(BIRD_X, y);
    this.setVelocity(0, 0);
    this.setAngle(0);
    this.setGravityY(0);
  }

  getIsAlive(): boolean {
    return this.isAlive;
  }
}
