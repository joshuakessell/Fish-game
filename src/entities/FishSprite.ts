import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

export class FishSprite extends Phaser.GameObjects.Sprite {
  public fishId: number;
  public typeId: number;
  private gameState: GameState;

  private previousPosition: [number, number] | null = null;
  private currentPosition: [number, number] | null = null;
  private previousRotation: number = 0;
  private previousFlipX: boolean = false;  // Track previous flip state to prevent oscillation

  constructor(scene: Phaser.Scene, fishId: number, typeId: number, x: number, y: number) {
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
    console.log(
      `🐟 Fish ${fishId} (type ${typeId}) created with scale ${scale}, visible: ${this.visible}, alpha: ${this.alpha}`,
    );

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

    const x = this.lerp(this.previousPosition[0], this.currentPosition[0], alpha);
    const y = this.lerp(this.previousPosition[1], this.currentPosition[1], alpha);

    this.setPosition(x, y);

    // Calculate velocity from position delta and update rotation
    const velocity = {
      x: this.currentPosition[0] - this.previousPosition[0],
      y: this.currentPosition[1] - this.previousPosition[1],
    };
    this.updateRotation(velocity);

    // Debug: log if fish becomes invisible or has alpha issues
    if (!this.visible || this.alpha < 0.1) {
      console.warn(
        `⚠️ Fish ${this.fishId} visibility issue - visible: ${this.visible}, alpha: ${this.alpha}`,
      );
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

    // Use horizontal mirroring for all fish instead of upside-down rotation
    // Most fish sprites naturally face right, so flip when moving left
    // Exception: Type 14 (Manta Ray) sprite naturally faces left, so flip when moving right
    
    // For Wave Rider (Type 21) and bonus fish on sine waves, use a velocity threshold
    // to prevent flipping during minor oscillations on curves
    const flipThreshold = (this.typeId === 21) ? 1.0 : 0.1;
    
    let shouldFlip: boolean;
    if (this.typeId === 14) {
      // Manta ray: flip when moving RIGHT
      shouldFlip = velocity.x > flipThreshold;
    } else {
      // Other fish: flip when moving LEFT
      shouldFlip = velocity.x < -flipThreshold;
    }
    
    // Only update flipX if velocity exceeds threshold or if not already flipped in that direction
    if (Math.abs(velocity.x) > flipThreshold) {
      this.setFlipX(shouldFlip);
      this.previousFlipX = shouldFlip;
    } else {
      // Velocity too small, maintain previous direction to prevent oscillation
      this.setFlipX(this.previousFlipX);
    }

    // Apply vertical tilt based on vertical movement
    // Use abs(velocity.x) to keep horizontal motion neutral (tilt=0 when moving horizontally)
    // Then invert the tilt when flipped to maintain the swimming forward illusion
    const tiltAngle = Math.atan2(velocity.y, Math.abs(velocity.x));
    const maxTilt = (Math.PI * 75) / 180; // 75 degrees in radians
    const clampedTilt = Phaser.Math.Clamp(tiltAngle, -maxTilt, maxTilt);
    
    // Invert tilt when fish is flipped to maintain swimming illusion
    // Manta Ray (Type 14) has inverted flipX logic, so its tilt inversion is also inverted
    let finalTilt: number;
    if (this.typeId === 14) {
      // Manta Ray: invert tilt logic since flipX is inverted
      finalTilt = this.flipX ? clampedTilt : -clampedTilt;
    } else {
      // Other fish: normal tilt inversion
      // When moving left (flipX=true), a downward tilt should become an upward tilt
      finalTilt = this.flipX ? -clampedTilt : clampedTilt;
    }

    this.rotation = this.lerpAngle(this.rotation || 0, finalTilt, 0.15);
  }

  /**
   * Interpolate between two angles, always taking the shortest path around the circle
   */
  private lerpAngle(currentAngle: number, targetAngle: number, t: number): number {
    // Calculate the difference between angles
    let diff = targetAngle - currentAngle;

    // Normalize to [-π, π] range to find shortest rotation
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;

    // Apply interpolation to the normalized difference
    return currentAngle + diff * t;
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
    // Small fish decreased by 20% from previous values:
    // Clownfish (0): 2.25x → 1.8x scale
    // Neon Tetra (1): 1.8x → 1.44x scale
    // Butterflyfish (2): 2.7x → 2.16x scale
    // Wave Rider (21): 3.0x scale (unchanged)
    // Medium fish (9): 1.5x scale
    // Shark (6): 2.2x scale
    // Large fish (12, 14): 2.5x scale

    const scaleMap: { [key: number]: number } = {
      0: 1.8, // Clownfish (small) - reduced 20% for better balance
      1: 1.44, // Neon Tetra (small) - reduced 20%
      2: 2.16, // Butterflyfish (small) - reduced 20%
      6: 2.2, // Lionfish (shark)
      9: 1.5, // Triggerfish (medium)
      12: 2.5, // Hammerhead Shark (large)
      14: 2.5, // Giant Manta Ray (large)
      21: 3.0, // Wave Rider (bonus) - unchanged
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
        },
      });
    });
  }
}
