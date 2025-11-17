import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export class FishSprite extends Phaser.GameObjects.Sprite {
  public fishId: number;
  public typeId: number;
  private gameState: GameState;

  private previousPosition: [number, number] | null = null;
  private currentPosition: [number, number] | null = null;
  private previousRotation: number = 0;

  constructor(
    scene: Phaser.Scene,
    fishId: number,
    typeId: number,
    x: number,
    y: number,
  ) {
    const texture = FishSprite.getTextureForType(typeId, scene);
    super(scene, x, y, texture);

    this.fishId = fishId;
    this.typeId = typeId;
    this.gameState = GameState.getInstance();

    scene.add.existing(this);

    this.setOrigin(0.5, 0.5);

    // Set fish size based on type
    const scale = FishSprite.getScaleForType(typeId);
    this.setScale(scale);
    console.log(`🐟 Fish ${fishId} (type ${typeId}) created with scale ${scale}, visible: ${this.visible}, alpha: ${this.alpha}`);

    this.previousPosition = [x, y];
    this.currentPosition = [x, y];

    // Play swim animation if available
    const animKey = `fish-${typeId}-swim`;
    if (this.scene.anims.exists(animKey)) {
      this.play(animKey);
      console.log(`🎬 Playing animation: ${animKey}`);
    } else {
      console.log(`📷 Using static texture for fish-${typeId} (no animation available)`);
    }

    this.setInteractive();
    
    this.on('pointerdown', () => {
      this.emit('fish-tapped', this.fishId);
    });
  }

  public updatePosition(tick: number): void {
    this.previousPosition = this.currentPosition;

    const position = this.gameState.getFishPosition(this.fishId, tick);

    if (position) {
      this.currentPosition = [position[0], position[1]];
    }
  }

  public render(alpha: number): void {
    if (!this.previousPosition || !this.currentPosition) {
      console.warn(`⚠️ Fish ${this.fishId} cannot render - missing position data`);
      return;
    }

    const x = this.lerp(
      this.previousPosition[0],
      this.currentPosition[0],
      alpha,
    );
    const y = this.lerp(
      this.previousPosition[1],
      this.currentPosition[1],
      alpha,
    );

    this.setPosition(x, y);

    // Calculate velocity from position delta and update rotation
    const velocity = {
      x: this.currentPosition[0] - this.previousPosition[0],
      y: this.currentPosition[1] - this.previousPosition[1],
    };
    this.updateRotation(velocity);

    // Debug: log if fish becomes invisible or has alpha issues
    if (!this.visible || this.alpha < 0.1) {
      console.warn(`⚠️ Fish ${this.fishId} visibility issue - visible: ${this.visible}, alpha: ${this.alpha}`);
    }
  }

  private lerp(start: number, end: number, alpha: number): number {
    return start + (end - start) * alpha;
  }

  private updateRotation(velocity: { x: number; y: number }): void {
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    
    if (speed < 0.1) {
      return;
    }
    
    const targetAngle = Math.atan2(velocity.y, velocity.x);
    
    // Special handling for Type 14 (manta ray)
    if (this.typeId === 14) {
      // Use flipX for left vs right
      this.setFlipX(velocity.x < 0);
      
      // Apply small tilt based on vertical movement only
      const tiltAngle = Math.atan2(velocity.y, Math.abs(velocity.x));
      const clampedTilt = Phaser.Math.Clamp(tiltAngle, -Math.PI / 4, Math.PI / 4);
      
      this.rotation = Phaser.Math.Linear(
        this.rotation || 0,
        clampedTilt,
        0.15
      );
    } else {
      // Normal rotation for other fish
      this.rotation = Phaser.Math.Linear(
        this.rotation || 0,
        targetAngle,
        0.15
      );
    }
  }

  private static getTextureForType(typeId: number, scene: Phaser.Scene): string {
    const spritesheetKey = `fish-${typeId}`;
    const staticKey = `fish-${typeId}-static`;
    
    // Try spritesheet first
    if (scene.textures.exists(spritesheetKey)) {
      return spritesheetKey;
    }
    
    // Fall back to static image
    if (scene.textures.exists(staticKey)) {
      return staticKey;
    }
    
    // Ultimate fallback
    return 'fish-0-static';
  }

  private static getScaleForType(typeId: number): number {
    // Small fish (0, 1, 2): +20% = 1.2x scale
    // Medium fish (6, 9): +50% = 1.5x scale
    // Large fish (12, 14): +150% = 2.5x scale
    // Wave Rider (21): +50% = 1.5x scale (bonus fish)
    
    const scaleMap: { [key: number]: number } = {
      0: 1.2,  // Clownfish (small)
      1: 1.2,  // Neon Tetra (small)
      2: 1.2,  // Butterflyfish (small)
      6: 1.5,  // Lionfish (medium)
      9: 1.5,  // Triggerfish (medium)
      12: 2.5, // Hammerhead Shark (large)
      14: 2.5, // Giant Manta Ray (large)
      21: 1.5, // Wave Rider (bonus)
    };

    return scaleMap[typeId] || 1.0;
  }

  public playDeathSequence(): Promise<void> {
    return new Promise<void>((resolve) => {
      const baseScale = FishSprite.getScaleForType(this.typeId);
      
      // White flash effect
      this.scene.tweens.add({
        targets: this,
        tint: 0xffffff,
        duration: 100,
        yoyo: true,
        repeat: 1,
      });

      // Scale pop effect
      this.scene.tweens.add({
        targets: this,
        scaleX: baseScale * 1.2,
        scaleY: baseScale * 1.2,
        duration: 200,
        yoyo: true,
        ease: 'Cubic.easeOut',
      });

      // Spiral rotation: 3 full spins (Math.PI * 6 radians)
      this.scene.tweens.add({
        targets: this,
        angle: this.angle + 360 * 3, // 3 full rotations
        duration: 1000,
        ease: 'Cubic.easeOut',
      });

      // Fade out to alpha 0
      this.scene.tweens.add({
        targets: this,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
          this.setVisible(false);
          resolve();
        }
      });
    });
  }
}
