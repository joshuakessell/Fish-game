import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { FishSpriteManager } from "../systems/FishSpriteManager";
import { BettingUI } from "../entities/BettingUI";

interface ClientBullet {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  graphics: Phaser.GameObjects.Graphics;
  createdAt: number;
}

export default class GameScene extends Phaser.Scene {
  private gameState: GameState;
  private fishSpriteManager!: FishSpriteManager;
  private clientBullets: Map<number, ClientBullet> = new Map();
  private nextBulletId = 1;

  private accumulator = 0;
  private readonly TICK_RATE = 30;
  private readonly MS_PER_TICK = 1000 / 30;
  private readonly MAX_DELTA = 100;

  private debugText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;

  private myTurret!: Phaser.GameObjects.Container;
  private turretBarrel!: Phaser.GameObjects.Graphics;
  private turretPosition!: { x: number; y: number };
  private bettingUI!: BettingUI;

  private readonly BULLET_SPEED = 800;
  private readonly MAX_BULLETS_PER_PLAYER = 30;
  private readonly BULLET_TIMEOUT_MS = 60000;

  constructor() {
    super({ key: "GameScene" });
    this.gameState = GameState.getInstance();
  }

  create() {
    console.log("GameScene: Creating game world");

    this.generatePlaceholderFishGraphics();

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);

    this.createAmbientBubbles();

    this.fishSpriteManager = new FishSpriteManager(this);

    this.createDebugOverlay();

    this.setupFishLifecycleCallbacks();

    this.setupSignalRHandlers();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSignalR, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.cleanupSignalR, this);

    this.createPlayerTurret();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.handleShoot(pointer.x, pointer.y);
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      this.rotateTurretToPointer(pointer.x, pointer.y);
    });

    console.log("GameScene: Initialization complete");
  }

  private generatePlaceholderFishGraphics() {
    const fishTypes = [
      { key: "fish-small", size: 20, color: 0x00ff00 },
      { key: "fish-medium", size: 40, color: 0x00aaff },
      { key: "fish-large", size: 60, color: 0xaa00ff },
      { key: "fish-boss", size: 100, color: 0xffaa00 },
    ];

    fishTypes.forEach(({ key, size, color }) => {
      const graphics = this.add.graphics();

      graphics.fillStyle(color, 1);
      graphics.fillCircle(size / 2, size / 2, size / 2);

      graphics.fillStyle(0xffffff, 0.8);
      graphics.fillCircle(size / 2 + size / 4, size / 2 - size / 6, size / 8);

      graphics.generateTexture(key, size, size);
      graphics.destroy();

      console.log(`Generated texture: ${key} (${size}px)`);
    });
  }

  private createDebugOverlay() {
    this.debugText = this.add.text(10, 10, "", {
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 10, y: 10 },
    });
    this.debugText.setDepth(1000);
    this.debugText.setScrollFactor(0);
  }

  private setupFishLifecycleCallbacks() {
    this.gameState.onFishSpawned = (fishId: number, typeId: number) => {
      this.fishSpriteManager.spawnFish(fishId, typeId);
    };

    this.gameState.onFishRemoved = (fishId: number) => {
      this.fishSpriteManager.removeFish(fishId);
    };

    this.gameState.onPayoutReceived = (fishId: number, payout: number) => {
      this.showCreditPopup(fishId, payout);
    };

    this.gameState.onCreditsChanged = () => {
      if (this.bettingUI) {
        this.bettingUI.updateBankDisplay();
      }
    };
  }

  private cleanupSignalR() {
    if (this.gameState.connection) {
      this.gameState.connection.off("StateDelta");
      console.log("GameScene: SignalR handlers cleaned up");
    }

    this.gameState.onFishSpawned = null;
    this.gameState.onFishRemoved = null;
    this.gameState.onPayoutReceived = null;
    this.gameState.onCreditsChanged = null;

    if (this.fishSpriteManager) {
      this.fishSpriteManager.clear();
    }
  }

  private setupSignalRHandlers() {
    const conn = this.gameState.connection;
    if (!conn) {
      console.error("GameScene: No SignalR connection available");
      return;
    }

    console.log("GameScene: SignalR event handlers registered");
  }

  update(time: number, delta: number) {
    const clampedDelta = Math.min(delta, this.MAX_DELTA);
    this.accumulator += clampedDelta;

    while (this.accumulator >= this.MS_PER_TICK) {
      this.fixedUpdate(this.gameState.currentTick);
      this.gameState.currentTick++;
      this.accumulator -= this.MS_PER_TICK;
    }

    const tickProgress = this.accumulator / this.MS_PER_TICK;

    this.fishSpriteManager.renderAllFish(tickProgress);
    this.updateBullets(delta);

    this.updateDebugOverlay(tickProgress);
  }

  private fixedUpdate(tick: number) {
    this.fishSpriteManager.updateAllFish(tick);
  }

  private updateDebugOverlay(tickProgress: number) {
    const fps = Math.round(this.game.loop.actualFps);
    const activeFish = this.fishSpriteManager.getActiveFishCount();
    const pathMode =
      this.gameState.fishPathManager.getTrackedFishCount() > 0 ? "ON" : "OFF";
    const accumulatorDrift = this.accumulator.toFixed(2);
    const tickDrift = this.gameState.tickDrift;
    const seat =
      this.gameState.myPlayerSlot !== null
        ? this.gameState.myPlayerSlot
        : "N/A";

    this.debugText.setText([
      `Current Tick: ${this.gameState.currentTick}`,
      `FPS: ${fps}`,
      `My Seat: ${seat}`,
      `Active Fish: ${activeFish}`,
      `Active Bullets: ${this.clientBullets.size}`,
      `Path Mode: ${pathMode}`,
      `Accumulator: ${accumulatorDrift}ms`,
      `Tick Progress: ${(tickProgress * 100).toFixed(1)}%`,
      `Tick Drift: ${tickDrift}`,
    ]);
  }

  private createAmbientBubbles() {
    // Create some animated bubbles for atmosphere
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1800;
      const y = 900 + Math.random() * 100;

      const bubble = this.add.circle(x, y, 5, 0xffffff, 0.3);

      this.tweens.add({
        targets: bubble,
        y: -100,
        x: x + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 8000 + Math.random() * 4000,
        repeat: -1,
        delay: Math.random() * 5000,
      });
    }
  }

  private getTurretPosition(seat: number): { x: number; y: number } {
    const positions = [
      { x: 0.12 * 1800, y: 810 }, // Seat 0: Bottom-left
      { x: 0.5 * 1800, y: 810 }, // Seat 1: Bottom-center
      { x: 0.88 * 1800, y: 810 }, // Seat 2: Bottom-right
      { x: 0.12 * 1800, y: 90 }, // Seat 3: Top-left
      { x: 0.5 * 1800, y: 90 }, // Seat 4: Top-center
      { x: 0.88 * 1800, y: 90 }, // Seat 5: Top-right
    ];
    return positions[seat] || { x: 900, y: 450 };
  }

  private createPlayerTurret() {
    const seat = this.gameState.myPlayerSlot;
    if (seat === null) {
      console.error("GameScene: No seat assigned for player");
      return;
    }

    this.turretPosition = this.getTurretPosition(seat);

    this.myTurret = this.add.container(
      this.turretPosition.x,
      this.turretPosition.y,
    );

    const base = this.add.graphics();
    base.fillStyle(0xb8860b, 1);
    base.fillCircle(0, 0, 35);
    base.fillStyle(0xdaa520, 1);
    base.fillCircle(0, 0, 28);
    base.lineStyle(2, 0x8b6914);
    base.strokeCircle(0, 0, 35);

    this.turretBarrel = this.add.graphics();
    this.turretBarrel.fillStyle(0xb8860b, 1);
    this.turretBarrel.fillRect(0, -8, 50, 16);
    this.turretBarrel.fillStyle(0xdaa520, 1);
    this.turretBarrel.fillRect(5, -6, 40, 12);
    this.turretBarrel.lineStyle(2, 0x8b6914);
    this.turretBarrel.strokeRect(0, -8, 50, 16);

    this.myTurret.add([base, this.turretBarrel]);
    this.myTurret.setDepth(100);

    console.log(
      `GameScene: Created turret at seat ${seat}, position (${this.turretPosition.x}, ${this.turretPosition.y})`,
    );

    this.createBettingUI(seat);
  }

  private createBettingUI(seat: number) {
    const offsetY = 60;

    this.bettingUI = new BettingUI(
      this,
      this.turretPosition.x,
      this.turretPosition.y + offsetY,
    );

    console.log(`GameScene: Created betting UI at seat ${seat}`);
  }

  private rotateTurretToPointer(x: number, y: number) {
    if (!this.myTurret) return;

    const angle = Phaser.Math.Angle.Between(
      this.turretPosition.x,
      this.turretPosition.y,
      x,
      y,
    );

    this.turretBarrel.rotation = angle;
  }

  private handleShoot(x: number, y: number) {
    if (!this.turretPosition) {
      console.error("GameScene: Turret position not set");
      return;
    }

    const dx = x - this.turretPosition.x;
    const dy = y - this.turretPosition.y;

    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;

    if (this.gameState.connection && this.gameState.isConnected) {
      this.gameState.connection
        .invoke(
          "Fire",
          this.turretPosition.x,
          this.turretPosition.y,
          dirX,
          dirY,
        )
        .catch((err) => {
          console.error("Failed to send Fire command:", err);
        });
      console.log(
        `Fired from (${this.turretPosition.x}, ${this.turretPosition.y}) in direction (${dirX.toFixed(2)}, ${dirY.toFixed(2)})`,
      );
    }
  }

  private createBullet(
    x: number,
    y: number,
    velocityX: number,
    velocityY: number,
  ) {
    const bulletId = this.nextBulletId++;

    const graphics = this.add.graphics();
    graphics.fillStyle(0xffff00, 1);
    graphics.fillEllipse(0, 0, 20, 6);
    graphics.lineStyle(1, 0xffaa00);
    graphics.strokeEllipse(0, 0, 20, 6);

    const bullet: ClientBullet = {
      id: bulletId,
      x: x,
      y: y,
      velocityX: velocityX,
      velocityY: velocityY,
      graphics: graphics,
      createdAt: Date.now(),
    };

    this.clientBullets.set(bulletId, bullet);
    graphics.setDepth(50);
  }

  private updateBullets(delta: number) {
    const deltaSeconds = delta / 1000;
    const now = Date.now();

    this.clientBullets.forEach((bullet, id) => {
      bullet.x += bullet.velocityX * deltaSeconds;
      bullet.y += bullet.velocityY * deltaSeconds;

      if (bullet.x < 0) {
        bullet.x = 0;
        bullet.velocityX = Math.abs(bullet.velocityX);
      } else if (bullet.x > 1800) {
        bullet.x = 1800;
        bullet.velocityX = -Math.abs(bullet.velocityX);
      }

      if (bullet.y < 0) {
        bullet.y = 0;
        bullet.velocityY = Math.abs(bullet.velocityY);
      } else if (bullet.y > 900) {
        bullet.y = 900;
        bullet.velocityY = -Math.abs(bullet.velocityY);
      }

      const angle = Math.atan2(bullet.velocityY, bullet.velocityX);
      bullet.graphics.setPosition(bullet.x, bullet.y);
      bullet.graphics.setRotation(angle);

      if (now - bullet.createdAt > this.BULLET_TIMEOUT_MS) {
        bullet.graphics.destroy();
        this.clientBullets.delete(id);
      }
    });
  }

  private showCreditPopup(fishId: number, payout: number) {
    const position = this.gameState.getFishPosition(
      fishId,
      this.gameState.currentTick,
    );

    let x = 900;
    let y = 450;

    if (position) {
      x = position[0];
      y = position[1];
    } else {
      const fishData = this.gameState.fish.get(fishId);
      if (fishData) {
        x = fishData.x;
        y = fishData.y;
      }
    }

    const popupText = this.add.text(x, y, `+${payout}`, {
      fontSize: "32px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#8B6914",
      strokeThickness: 4,
    });
    popupText.setOrigin(0.5, 0.5);
    popupText.setDepth(200);

    this.tweens.add({
      targets: popupText,
      y: y - 100,
      alpha: 0,
      duration: 1500,
      ease: "Cubic.easeOut",
      onComplete: () => {
        popupText.destroy();
      },
    });

    console.log(`Credit popup: +${payout} at fish ${fishId}`);
  }
}
