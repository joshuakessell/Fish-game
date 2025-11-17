import Phaser from 'phaser';
import { FishSprite } from './FishSprite';

export interface BulletConfig {
  id: number;
  x: number;
  y: number;
  directionX: number;
  directionY: number;
  isHoming?: boolean;
  targetFishId?: number | null;
  createdAt: number;
}

export class Bullet {
  public id: number;
  public x: number;
  public y: number;
  public directionX: number;
  public directionY: number;
  public graphics: Phaser.GameObjects.Graphics;
  public createdAt: number;
  public isHoming: boolean;
  public targetFishId: number | null;

  private scene: Phaser.Scene;
  private readonly NORMAL_SPEED = 800;
  private readonly HOMING_SPEED = 600;
  private readonly TURN_RATE = 3.0;

  constructor(scene: Phaser.Scene, config: BulletConfig) {
    this.scene = scene;
    this.id = config.id;
    this.x = config.x;
    this.y = config.y;
    this.directionX = config.directionX;
    this.directionY = config.directionY;
    this.isHoming = config.isHoming || false;
    this.targetFishId = config.targetFishId || null;
    this.createdAt = config.createdAt;

    this.graphics = scene.add.graphics();
    this.updateGraphics();
    this.graphics.setDepth(50);
  }

  public updateFromServer(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    syncDirection: boolean = true,
  ): void {
    // Always sync position from server (authoritative)
    this.x = x;
    this.y = y;

    // Only sync direction for non-homing bullets
    // Homing bullets calculate their own direction based on target tracking
    if (syncDirection) {
      this.directionX = directionX;
      this.directionY = directionY;
    }
  }

  private updateGraphics(): void {
    this.graphics.clear();

    if (this.isHoming) {
      this.graphics.fillStyle(0xff00ff, 1);
      this.graphics.fillEllipse(0, 0, 22, 8);
      this.graphics.lineStyle(2, 0xff66ff);
      this.graphics.strokeEllipse(0, 0, 22, 8);

      this.graphics.fillStyle(0xffffff, 0.6);
      this.graphics.fillCircle(-4, 0, 3);
    } else {
      this.graphics.fillStyle(0xffff00, 1);
      this.graphics.fillEllipse(0, 0, 20, 6);
      this.graphics.lineStyle(1, 0xffaa00);
      this.graphics.strokeEllipse(0, 0, 20, 6);
    }
  }

  public update(delta: number, fishSprites: Map<number, FishSprite>): void {
    const deltaSeconds = delta / 1000;
    const speed = this.isHoming ? this.HOMING_SPEED : this.NORMAL_SPEED;

    if (this.isHoming && this.targetFishId !== null) {
      const targetFish = fishSprites.get(this.targetFishId);

      if (targetFish && targetFish.active) {
        const dx = targetFish.x - this.x;
        const dy = targetFish.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
          const targetDirX = dx / distance;
          const targetDirY = dy / distance;

          const currentAngle = Math.atan2(this.directionY, this.directionX);
          const targetAngle = Math.atan2(targetDirY, targetDirX);

          let angleDiff = targetAngle - currentAngle;
          while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
          while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

          const maxTurn = this.TURN_RATE * deltaSeconds;
          const actualTurn = Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

          const newAngle = currentAngle + actualTurn;
          this.directionX = Math.cos(newAngle);
          this.directionY = Math.sin(newAngle);
        }
      } else {
        this.targetFishId = null;
      }
    }

    this.x += this.directionX * speed * deltaSeconds;
    this.y += this.directionY * speed * deltaSeconds;

    this.handleBounce();

    const angle = Math.atan2(this.directionY, this.directionX);
    this.graphics.setPosition(this.x, this.y);
    this.graphics.setRotation(angle);
  }

  private handleBounce(): void {
    if (this.x < 0) {
      this.x = 0;
      this.directionX = Math.abs(this.directionX);
    } else if (this.x > 1800) {
      this.x = 1800;
      this.directionX = -Math.abs(this.directionX);
    }

    if (this.y < 0) {
      this.y = 0;
      this.directionY = Math.abs(this.directionY);
    } else if (this.y > 900) {
      this.y = 900;
      this.directionY = -Math.abs(this.directionY);
    }
  }

  public destroy(): void {
    if (this.graphics) {
      this.graphics.destroy();
    }
  }
}
