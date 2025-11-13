import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export class FishSprite extends Phaser.GameObjects.Sprite {
  public fishId: number;
  public typeId: number;
  private gameState: GameState;

  private previousPosition: [number, number] | null = null;
  private currentPosition: [number, number] | null = null;

  constructor(
    scene: Phaser.Scene,
    fishId: number,
    typeId: number,
    x: number,
    y: number,
  ) {
    const texture = FishSprite.getTextureForType(typeId);
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

    // Debug: log if fish becomes invisible or has alpha issues
    if (!this.visible || this.alpha < 0.1) {
      console.warn(`⚠️ Fish ${this.fishId} visibility issue - visible: ${this.visible}, alpha: ${this.alpha}`);
    }
  }

  private lerp(start: number, end: number, alpha: number): number {
    return start + (end - start) * alpha;
  }

  private static getTextureForType(typeId: number): string {
    const availableSprites: { [key: number]: string } = {
      0: "fish-0",
      1: "fish-1",
      2: "fish-2",
      6: "fish-6",
      9: "fish-9",
      12: "fish-12",
      14: "fish-14",
      21: "fish-21",
    };

    if (availableSprites[typeId]) {
      return availableSprites[typeId];
    }

    console.warn(
      `No sprite available for fish typeId ${typeId}, using fallback fish-0`,
    );
    return "fish-0";
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
}
