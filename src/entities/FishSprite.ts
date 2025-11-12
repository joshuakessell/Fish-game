import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

export class FishSprite extends Phaser.GameObjects.Sprite {
  public fishId: number;
  public typeId: number;
  private gameState: GameState;
  
  private previousPosition: [number, number] | null = null;
  private currentPosition: [number, number] | null = null;

  constructor(scene: Phaser.Scene, fishId: number, typeId: number, x: number, y: number) {
    const texture = FishSprite.getTextureForType(typeId);
    super(scene, x, y, texture);
    
    this.fishId = fishId;
    this.typeId = typeId;
    this.gameState = GameState.getInstance();
    
    scene.add.existing(this);
    
    this.setOrigin(0.5, 0.5);
    
    this.previousPosition = [x, y];
    this.currentPosition = [x, y];
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
      return;
    }
    
    const x = this.lerp(this.previousPosition[0], this.currentPosition[0], alpha);
    const y = this.lerp(this.previousPosition[1], this.currentPosition[1], alpha);
    
    this.setPosition(x, y);
  }
  
  private lerp(start: number, end: number, alpha: number): number {
    return start + (end - start) * alpha;
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
