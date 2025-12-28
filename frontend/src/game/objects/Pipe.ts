import Phaser from 'phaser';
import { GAME_HEIGHT, PIPE_GAP, PIPE_SPEED } from '../config';

/**
 * Pipe class - Beautiful obstacles using separate PNG sprites
 * 
 * Uses pipe-top.png and pipe-bottom.png for smooth graphics
 * Original images: 1024x1536
 */
export class Pipe extends Phaser.GameObjects.Container {
  private topPipe: Phaser.GameObjects.Image;
  private bottomPipe: Phaser.GameObjects.Image;
  private scored: boolean = false;

  // Target pipe width in game (height is proportional)
  private static readonly TARGET_WIDTH = 60;

  constructor(scene: Phaser.Scene, x: number) {
    super(scene, x, 0);

    // Calculate random gap position
    const minGapY = 100;
    const maxGapY = GAME_HEIGHT - 100;
    const gapCenterY = Phaser.Math.Between(minGapY, maxGapY);

    // Calculate scale: original is 1024 wide, target is 60px
    const pipeScale = Pipe.TARGET_WIDTH / 1024;

    // Top pipe - positioned above gap
    const topPipeY = gapCenterY - PIPE_GAP / 2;
    this.topPipe = scene.add.image(0, topPipeY, 'pipe-top');
    this.topPipe.setScale(pipeScale);
    this.topPipe.setOrigin(0.5, 1); // Anchor at bottom center

    // Bottom pipe - positioned below gap  
    const bottomPipeY = gapCenterY + PIPE_GAP / 2;
    this.bottomPipe = scene.add.image(0, bottomPipeY, 'pipe-bottom');
    this.bottomPipe.setScale(pipeScale);
    this.bottomPipe.setOrigin(0.5, 0); // Anchor at top center

    // Add to container
    this.add([this.topPipe, this.bottomPipe]);

    // Add container to scene
    scene.add.existing(this);

    // Enable physics on the container
    scene.physics.add.existing(this);

    // Set velocity to move left
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-PIPE_SPEED);
    body.setAllowGravity(false);
    body.setImmovable(true);

    this.setDepth(5);
  }

  getTopPipe(): Phaser.GameObjects.Image {
    return this.topPipe;
  }

  getBottomPipe(): Phaser.GameObjects.Image {
    return this.bottomPipe;
  }

  hasScored(): boolean {
    return this.scored;
  }

  markScored(): void {
    this.scored = true;
  }

  isOffScreen(): boolean {
    return this.x < -80;
  }
}

/**
 * Pipe Manager - handles spawning and cleanup of pipes
 */
export class PipeManager {
  private scene: Phaser.Scene;
  private pipes: Pipe[] = [];
  private pipeGroup: Phaser.Physics.Arcade.Group;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.pipeGroup = scene.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
  }

  spawnPipe(x: number): Pipe {
    const pipe = new Pipe(this.scene, x);
    this.pipes.push(pipe);

    this.pipeGroup.add(pipe.getTopPipe());
    this.pipeGroup.add(pipe.getBottomPipe());

    return pipe;
  }

  update(): void {
    this.pipes.forEach(pipe => {
      const topPipe = pipe.getTopPipe();
      const bottomPipe = pipe.getBottomPipe();
      topPipe.x = pipe.x;
      bottomPipe.x = pipe.x;
    });

    this.pipes = this.pipes.filter(pipe => {
      if (pipe.isOffScreen()) {
        this.pipeGroup.remove(pipe.getTopPipe(), true, true);
        this.pipeGroup.remove(pipe.getBottomPipe(), true, true);
        pipe.destroy();
        return false;
      }
      return true;
    });
  }

  getPipes(): Pipe[] {
    return this.pipes;
  }

  getGroup(): Phaser.Physics.Arcade.Group {
    return this.pipeGroup;
  }

  clear(): void {
    this.pipes.forEach(pipe => {
      this.pipeGroup.remove(pipe.getTopPipe(), true, true);
      this.pipeGroup.remove(pipe.getBottomPipe(), true, true);
      pipe.destroy();
    });
    this.pipes = [];
  }
}
