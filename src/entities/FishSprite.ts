import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

export class FishSprite extends Phaser.GameObjects.Sprite {
  public fishId: number;
  public typeId: number;
  private gameState: GameState;

  constructor(scene: Phaser.Scene, fishId: number, typeId: number, x: number, y: number) {
    const texture = FishSprite.getTextureForType(typeId);
    super(scene, x, y, texture);
    
    this.fishId = fishId;
    this.typeId = typeId;
    this.gameState = GameState.getInstance();
    
    scene.add.existing(this);
    
    this.setOrigin(0.5, 0.5);
  }

  public updatePosition(tick: number): void {
    // Pass client tick to enable deterministic path computation
    const position = this.gameState.getFishPosition(this.fishId, tick);
    
    if (position) {
      this.setPosition(position[0], position[1]);
    }
  }

  private static getTextureForType(typeId: number): string {
    if (typeId >= 90) {
      return 'fish-boss';
    } else if (typeId >= 50) {
      return 'fish-large';
    } else if (typeId >= 20) {
      return 'fish-medium';
    } else {
      return 'fish-small';
    }
  }
}
