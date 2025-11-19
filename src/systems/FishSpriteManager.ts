import Phaser from 'phaser';
import { FishSprite } from '../entities/FishSprite';
import { GameState } from './GameState';

export class FishSpriteManager {
  private fishSprites: Map<number, FishSprite> = new Map();
  private scene: Phaser.Scene;
  private gameState: GameState;
  private killedFishIds: Set<number> = new Set(); // Track fish killed by bullets vs path completion

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameState = GameState.getInstance();
  }
  
  public markFishAsKilled(fishId: number): void {
    this.killedFishIds.add(fishId);
  }

  public spawnFish(fishId: number, typeId: number): void {
    if (this.fishSprites.has(fishId)) {
      console.warn(`Fish ${fishId} already exists, skipping spawn`);
      return;
    }
    
    // Defensive cleanup: Remove any stale kill state from recycled fish IDs
    if (this.killedFishIds.has(fishId)) {
      console.warn(`⚠️ Clearing stale kill state for recycled fish ID ${fishId}`);
      this.killedFishIds.delete(fishId);
    }

    // Try to get path-based position first
    let initialPosition = this.gameState.getFishPosition(fishId, this.gameState.currentTick);

    // Fall back to server-provided x/y if path not yet available
    if (!initialPosition) {
      const fishData = this.gameState.fish.get(fishId);
      if (fishData) {
        initialPosition = [fishData[2], fishData[3]];
        console.log(`Fish ${fishId} spawning with server position (path not yet ready)`);
      } else {
        console.warn(`Cannot spawn fish ${fishId}: no position data available at all`);
        return;
      }
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

  public async removeFish(fishId: number): Promise<void> {
    const sprite = this.fishSprites.get(fishId);
    if (sprite) {
      const wasKilled = this.killedFishIds.has(fishId);
      
      if (wasKilled) {
        // Fish was killed by bullet - play death animation with flash
        console.log(`🎬 Playing death sequence for killed fish ${fishId}`);
        await sprite.playDeathSequence();
        this.killedFishIds.delete(fishId); // Clean up tracking
      } else {
        // Fish completed path naturally - fade out smoothly without flash
        console.log(`🌊 Fish ${fishId} completed path, fading out silently`);
        await new Promise<void>((resolve) => {
          this.scene.tweens.add({
            targets: sprite,
            alpha: 0,
            duration: 300,
            ease: 'Cubic.easeOut',
            onComplete: () => {
              sprite.setVisible(false);
              resolve();
            },
          });
        });
      }
      
      console.log(`🗑️ Destroying fish ${fishId}`);
      sprite.destroy();
      this.fishSprites.delete(fishId);
      
      // Defensive cleanup: Ensure killed state is removed even if not found above
      if (this.killedFishIds.has(fishId)) {
        this.killedFishIds.delete(fishId);
      }
      
      console.log(`✅ Removed fish ${fishId} from sprite manager`);
    } else {
      console.warn(`⚠️ Attempted to remove non-existent fish ${fishId}`);
      // Still clean up kill state for non-existent fish to prevent leaks
      this.killedFishIds.delete(fishId);
    }
  }

  public clear(): void {
    for (const sprite of this.fishSprites.values()) {
      sprite.destroy();
    }
    this.fishSprites.clear();
    // Clear kill tracking when clearing all sprites
    this.killedFishIds.clear();
  }

  public getActiveFishCount(): number {
    return this.fishSprites.size;
  }

  public getFishSprites(): Map<number, FishSprite> {
    return this.fishSprites;
  }
}
