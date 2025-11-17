import Phaser from 'phaser';
import { GameState } from './GameState';
import { FishSpriteManager } from './FishSpriteManager';
import { getPlayerBankPosition } from '../utils/PlayerSeatLayout';

export class RewardAnimationManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private fishSpriteManager: FishSpriteManager;
  private bankPositions: Map<number, { x: number; y: number }> = new Map();

  constructor(scene: Phaser.Scene, gameState: GameState, fishSpriteManager: FishSpriteManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.fishSpriteManager = fishSpriteManager;

    for (let slot = 0; slot < 6; slot++) {
      this.bankPositions.set(slot, getPlayerBankPosition(slot));
    }
  }

  public setBankPosition(playerSlot: number, x: number, y: number): void {
    this.bankPositions.set(playerSlot, { x, y });
  }

  public playRewardAnimation(
    fishId: number,
    payout: number,
    playerSlot: number,
    isOwnKill: boolean,
  ): void {
    console.log(
      `🎬 [RewardAnimationManager] playRewardAnimation called: fishId=${fishId}, payout=${payout}, playerSlot=${playerSlot}, isOwnKill=${isOwnKill}`,
    );

    const fishSprite = this.fishSpriteManager.getFishSprites().get(fishId);
    if (!fishSprite) {
      console.warn(`   ⚠️ Cannot play reward animation: fish ${fishId} sprite not found`);
      return;
    }

    const fishPosition = { x: fishSprite.x, y: fishSprite.y };
    console.log(`   → Fish position: (${fishPosition.x}, ${fishPosition.y})`);

    const bankPosition = this.bankPositions.get(playerSlot);

    if (!bankPosition) {
      console.warn(
        `   ⚠️ Cannot play reward animation: bank position for slot ${playerSlot} not found`,
      );
      return;
    }

    console.log(
      `   → Bank position for slot ${playerSlot}: (${bankPosition.x}, ${bankPosition.y})`,
    );
    console.log(`   → Creating floating text and coin animation`);

    this.createFloatingText(fishPosition, payout, isOwnKill);
    this.createCoinJumpAnimation(fishPosition, bankPosition, isOwnKill);
  }

  private createFloatingText(
    position: { x: number; y: number },
    payout: number,
    isOwnKill: boolean,
  ): void {
    const fontSize = isOwnKill ? '32px' : '24px';
    const color = isOwnKill ? '#FFD700' : '#C0C0C0';
    const strokeColor = isOwnKill ? '#8B4513' : '#666666';

    const text = this.scene.add.text(position.x, position.y, `+${payout}`, {
      fontSize: fontSize,
      color: color,
      fontStyle: 'bold',
      stroke: strokeColor,
      strokeThickness: 4,
    });
    text.setOrigin(0.5, 0.5);
    text.setDepth(200);

    this.scene.tweens.add({
      targets: text,
      y: position.y - 80,
      alpha: 0,
      duration: 1200,
      ease: 'Cubic.easeOut',
      onComplete: () => {
        text.destroy();
      },
    });
  }

  private createCoinJumpAnimation(
    fishPosition: { x: number; y: number },
    bankPosition: { x: number; y: number },
    isOwnKill: boolean,
  ): void {
    const coinSize = isOwnKill ? 32 : 24;
    const coin = this.createCoinGraphic(coinSize, isOwnKill);
    coin.setPosition(fishPosition.x, fishPosition.y);
    coin.setDepth(200);

    const midX = (fishPosition.x + bankPosition.x) / 2;
    const midY = Math.min(fishPosition.y, bankPosition.y) - 150;

    const path = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(fishPosition.x, fishPosition.y),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(bankPosition.x, bankPosition.y),
    );

    let pathProgress = 0;

    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: 800,
      ease: 'Cubic.easeInOut',
      onUpdate: (tween) => {
        const value = tween.getValue();
        pathProgress = value !== null ? value : 0;
        const point = path.getPoint(pathProgress);
        coin.setPosition(point.x, point.y);
        coin.setRotation(pathProgress * Math.PI * 6);
      },
      onComplete: () => {
        coin.destroy();
      },
    });
  }

  private createCoinGraphic(size: number, isGolden: boolean): Phaser.GameObjects.Graphics {
    const coin = this.scene.add.graphics();

    if (isGolden) {
      coin.fillStyle(0xffd700, 1);
      coin.fillCircle(0, 0, size / 2);
      coin.fillStyle(0xffed4e, 1);
      coin.fillCircle(-size / 8, -size / 8, size / 4);
      coin.lineStyle(2, 0xdaa520, 1);
      coin.strokeCircle(0, 0, size / 2);
    } else {
      coin.fillStyle(0xc0c0c0, 1);
      coin.fillCircle(0, 0, size / 2);
      coin.fillStyle(0xe0e0e0, 1);
      coin.fillCircle(-size / 8, -size / 8, size / 4);
      coin.lineStyle(2, 0xa0a0a0, 1);
      coin.strokeCircle(0, 0, size / 2);
    }

    return coin;
  }
}
