import Phaser from "phaser";
import { FishSprite } from "../entities/FishSprite";
import { GameState } from "./GameState";

export class FishSpriteManager {
  private fishSprites: Map<number, FishSprite> = new Map();
  private scene: Phaser.Scene;
  private gameState: GameState;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameState = GameState.getInstance();
  }

  public spawnFish(fishId: number, typeId: number): void {
    if (this.fishSprites.has(fishId)) {
      console.warn(`Fish ${fishId} already exists, skipping spawn`);
      return;
    }

    // Use server tick for initial spawn position
    const initialPosition = this.gameState.getFishPosition(
      fishId,
      this.gameState.currentTick,
    );
    if (!initialPosition) {
      console.warn(`Cannot spawn fish ${fishId}: no position available`);
      return;
    }

    const sprite = new FishSprite(
      this.scene,
      fishId,
      typeId,
      initialPosition[0],
      initialPosition[1],
    );

    this.fishSprites.set(fishId, sprite);
    console.log(
      `Spawned fish ${fishId} (type ${typeId}) at (${initialPosition[0]}, ${initialPosition[1]})`,
    );
  }

  public updateAllFish(tick: number): void {
    for (const sprite of this.fishSprites.values()) {
      sprite.updatePosition(tick);
    }
  }

  public renderAllFish(alpha: number): void {
    for (const sprite of this.fishSprites.values()) {
      sprite.render(alpha);
    }
  }

  public removeFish(fishId: number): void {
    const sprite = this.fishSprites.get(fishId);
    if (sprite) {
      sprite.destroy();
      this.fishSprites.delete(fishId);
      console.log(`Removed fish ${fishId}`);
    }
  }

  public clear(): void {
    for (const sprite of this.fishSprites.values()) {
      sprite.destroy();
    }
    this.fishSprites.clear();
  }

  public getActiveFishCount(): number {
    return this.fishSprites.size;
  }
}
