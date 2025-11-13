import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { FishSpriteManager } from "../systems/FishSpriteManager";
import { RewardAnimationManager } from "../systems/RewardAnimationManager";
import { BettingUI } from "../entities/BettingUI";
import { BulletData } from "../types/GameTypes";
import { Bullet } from "../entities/Bullet";

export default class GameScene extends Phaser.Scene {
  private gameState: GameState;
  private fishSpriteManager!: FishSpriteManager;
  private rewardAnimationManager!: RewardAnimationManager;
  private clientBullets: Map<number, Bullet> = new Map();
  private nextBulletId = -1;
  private pendingLocalBullets: Map<string, number> = new Map();

  private isHoldingFire: boolean = false;
  private holdFireInterval: NodeJS.Timeout | null = null;
  private autoTargetMode: boolean = false;
  private autoTargetInterval: NodeJS.Timeout | null = null;
  private currentTarget: number | null = null;
  private currentTargetType: number | null = null;
  private lastTapTime: number = 0;
  private lastTappedFish: number | null = null;
  private autoTargetIndicator!: Phaser.GameObjects.Graphics | null;
  private autoTargetText!: Phaser.GameObjects.Text | null;
  private targetIcon: Phaser.GameObjects.Graphics | null = null;

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

  preload() {
    // Load real fish images
    this.load.image("fish-small", "/assets/fish/Small_clownfish_sprite_226a82aa.png");
    this.load.image("fish-medium", "/assets/fish/Medium_lionfish_sprite_96d7f97c.png");
    this.load.image("fish-large", "/assets/fish/Large_shark_sprite_e30aab34.png");
    this.load.image("fish-boss", "/assets/fish/Boss_whale_sprite_7a904894.png");
  }

  create() {
    console.log("GameScene: Creating game world");

    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);

    this.createAmbientBubbles();

    this.fishSpriteManager = new FishSpriteManager(this);
    this.rewardAnimationManager = new RewardAnimationManager(
      this,
      this.gameState,
      this.fishSpriteManager,
    );

    this.createDebugOverlay();

    this.setupFishLifecycleCallbacks();

    this.setupSignalRHandlers();

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.cleanupSignalR, this);
    this.events.on(Phaser.Scenes.Events.DESTROY, this.cleanupSignalR, this);

    this.createPlayerTurret();

    this.createAutoTargetIndicator();

    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.startHoldFire(pointer.x, pointer.y);
    });

    this.input.on("pointerup", () => {
      this.stopHoldFire();
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.autoTargetMode) {
        this.rotateTurretToPointer(pointer.x, pointer.y);
      }
    });

    console.log("GameScene: Initialization complete");
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
      console.log(`🐟 Fish spawned callback: fishId=${fishId}, typeId=${typeId}`);
      this.fishSpriteManager.spawnFish(fishId, typeId);
      
      const fishSprite = this.fishSpriteManager.getFishSprites().get(fishId);
      if (fishSprite) {
        fishSprite.on('fish-tapped', this.handleFishTapped, this);
      }

      if (this.autoTargetMode && this.currentTargetType !== null && 
          this.currentTarget === null && typeId === this.currentTargetType) {
        console.log(`Fish of target type ${this.currentTargetType} spawned, resuming auto-fire`);
        this.currentTarget = fishId;
      }
    };

    this.gameState.onFishRemoved = async (fishId: number) => {
      console.log(`🐟 Fish removed callback: fishId=${fishId}`);
      await this.fishSpriteManager.removeFish(fishId);

      if (this.autoTargetMode && fishId === this.currentTarget) {
        console.log(`Targeted fish ${fishId} removed, retargeting...`);
        this.currentTarget = this.currentTargetType !== null 
          ? this.findNearestFishOfType(this.currentTargetType)
          : null;
      }
    };

    // Spawn any fish that already exist in the game state (when joining existing game)
    console.log(`Checking for existing fish in game state... Found ${this.gameState.fish.size} fish`);
    this.gameState.fish.forEach((fishData, fishId) => {
      const typeId = fishData[1]; // FishData is tuple: [id, type, x, y, path, isNewSpawn]
      console.log(`🐟 Spawning existing fish ${fishId} (type ${typeId})`);
      this.fishSpriteManager.spawnFish(fishId, typeId);
      
      const fishSprite = this.fishSpriteManager.getFishSprites().get(fishId);
      if (fishSprite) {
        fishSprite.on('fish-tapped', this.handleFishTapped, this);
      }
    });

    this.gameState.onBulletSpawned = (bulletData) => {
      if (!this.clientBullets.has(bulletData[0])) {
        console.log(`💥 Bullet spawned from server: id=${bulletData[0]}, pos=(${bulletData[1]}, ${bulletData[2]})`);
        this.createBulletFromServer(bulletData);
      }
    };

    this.gameState.onBulletRemoved = (bulletId: number) => {
      const bullet = this.clientBullets.get(bulletId);
      if (bullet) {
        console.log(`💥 Bullet removed from server: id=${bulletId}`);
        bullet.destroy();
        this.clientBullets.delete(bulletId);
      }
    };

    this.gameState.onPayoutEvent = (
      fishId: number,
      payout: number,
      playerSlot: number,
      isOwnKill: boolean,
    ) => {
      console.log(`💰 Payout event: fishId=${fishId}, payout=${payout}, playerSlot=${playerSlot}, isOwnKill=${isOwnKill}`);
      this.rewardAnimationManager.playRewardAnimation(
        fishId,
        payout,
        playerSlot,
        isOwnKill,
      );
    };

    this.gameState.onPayoutReceived = (fishId: number, payout: number) => {
      this.showCreditPopup(fishId, payout);
    };

    this.gameState.onCreditsChanged = () => {
      if (this.bettingUI) {
        this.bettingUI.updateBankDisplay();
      }
    };

    this.gameState.onTickSnapped = () => {
      this.accumulator = 0;
      console.log("GameScene: Accumulator reset after tick snap");
    };
  }

  private cleanupSignalR() {
    if (this.gameState.connection) {
      this.gameState.connection.off("StateDelta");
      console.log("GameScene: SignalR handlers cleaned up");
    }

    this.stopHoldFire();
    this.stopAutoTargeting();

    this.gameState.onFishSpawned = null;
    this.gameState.onFishRemoved = null;
    this.gameState.onBulletSpawned = null;
    this.gameState.onBulletRemoved = null;
    this.gameState.onPayoutEvent = null;
    this.gameState.onPayoutReceived = null;
    this.gameState.onCreditsChanged = null;
    this.gameState.onTickSnapped = null;

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
      if (this.gameState.isSynced) {
        this.gameState.currentTick++;
      }
      this.accumulator -= this.MS_PER_TICK;
    }

    const tickProgress = this.accumulator / this.MS_PER_TICK;

    this.fishSpriteManager.renderAllFish(tickProgress);
    this.updateBullets(delta);
    this.updateAutoTargetIndicator();

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
      `Auto-Target: ${this.autoTargetMode ? "ON" : "OFF"}`,
      `Hold Fire: ${this.isHoldingFire ? "YES" : "NO"}`,
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

    this.rewardAnimationManager.setBankPosition(
      seat,
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

  private startHoldFire(x: number, y: number) {
    // Auto-fire exclusivity: exit auto-target mode if user tries to fire manually
    if (this.autoTargetMode) {
      console.log("Auto-target deactivated - manual fire attempted");
      this.stopAutoTargeting();
      return;
    }

    this.stopHoldFire();
    this.isHoldingFire = true;

    this.handleShoot(x, y);

    // Auto-fire at 250ms intervals (4 shots/second)
    this.holdFireInterval = setInterval(() => {
      if (this.isHoldingFire && this.input.activePointer) {
        // Use current pointer position, not initial click position
        this.handleShoot(this.input.activePointer.worldX, this.input.activePointer.worldY);
      }
    }, 250);
  }

  private stopHoldFire() {
    this.isHoldingFire = false;
    if (this.holdFireInterval) {
      clearInterval(this.holdFireInterval);
      this.holdFireInterval = null;
    }
  }

  private handleFishTapped(fishId: number) {
    const now = Date.now();
    const isDoubleTap = 
      this.lastTappedFish === fishId && 
      now - this.lastTapTime < 300;

    if (isDoubleTap) {
      this.toggleAutoTargeting(fishId);
      this.lastTappedFish = null;
      this.lastTapTime = 0;
    } else {
      this.lastTappedFish = fishId;
      this.lastTapTime = now;
    }
  }

  private toggleAutoTargeting(fishId?: number) {
    if (this.autoTargetMode) {
      this.stopAutoTargeting();
    } else {
      this.startAutoTargeting(fishId);
    }
  }

  private startAutoTargeting(initialTarget?: number) {
    this.autoTargetMode = true;
    this.currentTarget = initialTarget ?? null; // Use ?? to preserve fish ID 0
    
    if (initialTarget !== undefined) {
      const fishData = this.gameState.fish.get(initialTarget);
      if (fishData) {
        this.currentTargetType = fishData[1];
        console.log(`Auto-targeting activated for fish type ${this.currentTargetType}`);
      }
    }
    
    this.updateAutoTargetIndicator();

    // Auto-fire at 250ms intervals (4 shots/second)
    this.autoTargetInterval = setInterval(() => {
      this.fireAtTarget();
    }, 250);

    console.log("Auto-targeting activated");
  }

  private stopAutoTargeting() {
    this.autoTargetMode = false;
    this.currentTarget = null;
    this.currentTargetType = null;
    
    if (this.targetIcon) {
      this.targetIcon.setVisible(false);
    }
    
    this.updateAutoTargetIndicator();

    if (this.autoTargetInterval) {
      clearInterval(this.autoTargetInterval);
      this.autoTargetInterval = null;
    }

    console.log("Auto-targeting deactivated");
  }

  private findNearestFish(): number | null {
    const fishSprites = this.fishSpriteManager.getFishSprites();
    let nearestFish: number | null = null;
    let nearestDistance = Infinity;

    fishSprites.forEach((sprite, fishId) => {
      if (sprite.active) {
        const distance = Phaser.Math.Distance.Between(
          this.turretPosition.x,
          this.turretPosition.y,
          sprite.x,
          sprite.y
        );

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestFish = fishId;
        }
      }
    });

    return nearestFish;
  }

  private findNearestFishOfType(typeId: number): number | null {
    const fishSprites = this.fishSpriteManager.getFishSprites();
    let nearestFish: number | null = null;
    let minDistance = Infinity;

    fishSprites.forEach((fishSprite, fishId) => {
      const fishData = this.gameState.fish.get(fishId);
      if (!fishData || fishData[1] !== typeId) return;

      const distance = Phaser.Math.Distance.Between(
        this.turretPosition.x,
        this.turretPosition.y,
        fishSprite.x,
        fishSprite.y
      );

      if (distance < minDistance) {
        minDistance = distance;
        nearestFish = fishId;
      }
    });

    return nearestFish;
  }

  private fireAtTarget() {
    if (!this.autoTargetMode) return;

    const fishSprites = this.fishSpriteManager.getFishSprites();
    
    if (this.currentTargetType !== null) {
      const currentFish = this.currentTarget !== null 
        ? this.gameState.fish.get(this.currentTarget) 
        : null;
      
      if (!currentFish || currentFish[1] !== this.currentTargetType) {
        this.currentTarget = this.findNearestFishOfType(this.currentTargetType);
      }

      if (this.currentTarget === null) {
        console.log(`No fish of type ${this.currentTargetType} available, pausing auto-fire`);
        return;
      }
    } else {
      const currentTargetSprite = this.currentTarget !== null 
        ? fishSprites.get(this.currentTarget) 
        : null;

      if (!currentTargetSprite || !currentTargetSprite.active) {
        this.currentTarget = this.findNearestFish();
      }

      if (this.currentTarget === null) {
        return;
      }
    }

    const targetSprite = fishSprites.get(this.currentTarget);
    if (!targetSprite) {
      this.currentTarget = this.currentTargetType !== null 
        ? this.findNearestFishOfType(this.currentTargetType)
        : this.findNearestFish();
      return;
    }

    const dx = targetSprite.x - this.turretPosition.x;
    const dy = targetSprite.y - this.turretPosition.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;

    const angle = Math.atan2(dy, dx);
    this.turretBarrel.rotation = angle;

    this.handleShoot(targetSprite.x, targetSprite.y, true, this.currentTarget);
  }

  private handleShoot(x: number, y: number, isHoming: boolean = false, targetFishId: number | null = null) {
    if (!this.turretPosition) {
      console.error("GameScene: Turret position not set");
      return;
    }

    const shotCost = this.gameState.currentBet;
    const currentCredits = this.gameState.playerAuth?.credits || 0;
    
    if (currentCredits < shotCost) {
      console.warn("Not enough credits to shoot");
      return;
    }

    const dx = x - this.turretPosition.x;
    const dy = y - this.turretPosition.y;

    const length = Math.sqrt(dx * dx + dy * dy);
    if (length === 0) return;

    const dirX = dx / length;
    const dirY = dy / length;

    const angle = Math.atan2(dy, dx);
    this.turretBarrel.rotation = angle;

    if (this.gameState.connection && this.gameState.isConnected) {
      this.gameState.deductShotCost();
      
      const nonce = `${Date.now()}-${Math.random()}`;
      
      this.createFiringEffect(dirX, dirY);
      
      const bulletId = this.createBullet(
        this.turretPosition.x,
        this.turretPosition.y,
        dirX,
        dirY,
        isHoming,
        targetFishId
      );
      
      this.pendingLocalBullets.set(nonce, bulletId);

      this.gameState.connection
        .invoke(
          "Fire",
          this.turretPosition.x,
          this.turretPosition.y,
          dirX,
          dirY,
          nonce,
          targetFishId,
        )
        .catch((err) => {
          console.error("Failed to send Fire command:", err);
        });
      console.log(
        `Fired ${isHoming ? "homing" : "normal"} bullet from (${this.turretPosition.x}, ${this.turretPosition.y}) in direction (${dirX.toFixed(2)}, ${dirY.toFixed(2)}), nonce: ${nonce}`,
      );
    }
  }

  private createBullet(
    x: number,
    y: number,
    directionX: number,
    directionY: number,
    isHoming: boolean = false,
    targetFishId: number | null = null
  ): number {
    const bulletId = this.nextBulletId--;

    const bullet = new Bullet(this, {
      id: bulletId,
      x: x,
      y: y,
      directionX: directionX,
      directionY: directionY,
      isHoming: isHoming,
      targetFishId: targetFishId,
      createdAt: Date.now(),
    });

    this.clientBullets.set(bulletId, bullet);
    
    return bulletId;
  }

  private createBulletFromServer(bulletData: BulletData) {
    const targetFishId = bulletData[7];
    const isHoming = targetFishId !== null;
    
    if (bulletData[6] && bulletData[5] === this.gameState.playerAuth?.userId) {
      const localBulletId = this.pendingLocalBullets.get(bulletData[6]);
      if (localBulletId !== undefined) {
        const localBullet = this.clientBullets.get(localBulletId);
        if (localBullet) {
          console.log(`🎯 Perfect reconciliation: removing local bullet ${localBulletId}, replacing with server bullet ${bulletData[0]} using nonce ${bulletData[6]}`);
          localBullet.destroy();
          this.clientBullets.delete(localBulletId);
          this.pendingLocalBullets.delete(bulletData[6]);
        } else {
          this.pendingLocalBullets.delete(bulletData[6]);
        }
      }
    }

    const bullet = new Bullet(this, {
      id: bulletData[0],
      x: bulletData[1],
      y: bulletData[2],
      directionX: bulletData[3],
      directionY: bulletData[4],
      isHoming: isHoming,
      targetFishId: targetFishId,
      createdAt: Date.now(),
    });

    this.clientBullets.set(bulletData[0], bullet);
  }

  private updateBullets(delta: number) {
    const now = Date.now();

    for (const [nonce, bulletId] of this.pendingLocalBullets.entries()) {
      const bullet = this.clientBullets.get(bulletId);
      if (!bullet || now - bullet.createdAt > 1000) {
        this.pendingLocalBullets.delete(nonce);
      }
    }

    const fishSprites = this.fishSpriteManager.getFishSprites();

    this.clientBullets.forEach((bullet, id) => {
      bullet.update(delta, fishSprites);

      fishSprites.forEach((fishSprite, fishId) => {
        const distance = Phaser.Math.Distance.Between(
          bullet.x,
          bullet.y,
          fishSprite.x,
          fishSprite.y
        );
        
        const hitRadius = 40;
        
        if (distance < hitRadius) {
          console.log(`💥 Bullet ${id} hit fish ${fishId}!`);
          
          this.createHitEffect(bullet.x, bullet.y);
          
          bullet.destroy();
          this.clientBullets.delete(id);
          return;
        }
      });

      if (now - bullet.createdAt > this.BULLET_TIMEOUT_MS) {
        bullet.destroy();
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
        x = fishData[2];
        y = fishData[3];
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

  private createHitEffect(x: number, y: number) {
    // Create flash circle
    const flash = this.add.circle(x, y, 30, 0xffffff, 0.8);
    flash.setDepth(150);

    this.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      ease: "Cubic.easeOut",
      onComplete: () => {
        flash.destroy();
      },
    });

    // Create particle burst
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 100 + Math.random() * 50;
      
      const particle = this.add.circle(x, y, 4, 0xffaa00, 1);
      particle.setDepth(140);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 400 + Math.random() * 200,
        ease: "Cubic.easeOut",
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private createFiringEffect(dirX: number, dirY: number) {
    if (!this.turretPosition) return;

    const angle = Math.atan2(dirY, dirX);
    const barrelLength = 50;
    const muzzleX = this.turretPosition.x + Math.cos(angle) * barrelLength;
    const muzzleY = this.turretPosition.y + Math.sin(angle) * barrelLength;

    // Muzzle flash
    const flash = this.add.circle(muzzleX, muzzleY, 25, 0xffff00, 0.9);
    flash.setDepth(110);

    this.tweens.add({
      targets: flash,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 150,
      ease: "Cubic.easeOut",
      onComplete: () => {
        flash.destroy();
      },
    });

    // Recoil animation
    const originalX = this.myTurret.x;
    const originalY = this.myTurret.y;
    const recoilDistance = 5;

    this.tweens.add({
      targets: this.myTurret,
      x: originalX - dirX * recoilDistance,
      y: originalY - dirY * recoilDistance,
      duration: 50,
      yoyo: true,
      ease: "Cubic.easeOut",
    });

    // Smoke puff
    for (let i = 0; i < 3; i++) {
      const smoke = this.add.circle(
        muzzleX + (Math.random() - 0.5) * 10,
        muzzleY + (Math.random() - 0.5) * 10,
        5 + Math.random() * 5,
        0x888888,
        0.4
      );
      smoke.setDepth(105);

      this.tweens.add({
        targets: smoke,
        scaleX: 2,
        scaleY: 2,
        alpha: 0,
        x: smoke.x + dirX * 20 + (Math.random() - 0.5) * 20,
        y: smoke.y + dirY * 20 - 20,
        duration: 500 + Math.random() * 300,
        ease: "Cubic.easeOut",
        onComplete: () => {
          smoke.destroy();
        },
      });
    }
  }

  private createAutoTargetIndicator() {
    this.autoTargetIndicator = this.add.graphics();
    this.autoTargetIndicator.setDepth(999);

    this.autoTargetText = this.add.text(110, 30, "AUTO-TARGET ACTIVE", {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.autoTargetText.setOrigin(0.5, 0.5);
    this.autoTargetText.setDepth(1000);
    this.autoTargetText.setVisible(false);

    this.targetIcon = this.add.graphics();
    this.targetIcon.lineStyle(3, 0xff0000, 1);
    this.targetIcon.strokeCircle(0, 0, 20);
    this.targetIcon.lineBetween(-25, 0, -10, 0);
    this.targetIcon.lineBetween(10, 0, 25, 0);
    this.targetIcon.lineBetween(0, -25, 0, -10);
    this.targetIcon.lineBetween(0, 10, 0, 25);
    this.targetIcon.setDepth(100);
    this.targetIcon.setVisible(false);

    this.updateAutoTargetIndicator();
  }

  private updateAutoTargetIndicator() {
    if (!this.autoTargetIndicator) return;

    this.autoTargetIndicator.clear();

    if (this.autoTargetMode) {
      this.autoTargetIndicator.lineStyle(4, 0xff00ff, 0.8);
      this.autoTargetIndicator.strokeRect(10, 10, 1780, 880);

      this.autoTargetIndicator.fillStyle(0xff00ff, 0.3);
      this.autoTargetIndicator.fillRect(10, 10, 200, 40);

      if (this.autoTargetText) {
        this.autoTargetText.setVisible(true);
      }

      if (this.currentTarget !== null) {
        const targetSprite = this.fishSpriteManager.getFishSprites().get(this.currentTarget);
        if (targetSprite && targetSprite.active) {
          this.autoTargetIndicator.lineStyle(3, 0xff00ff, 0.9);
          this.autoTargetIndicator.strokeCircle(targetSprite.x, targetSprite.y, 50);

          this.autoTargetIndicator.lineStyle(2, 0xff00ff, 0.6);
          this.autoTargetIndicator.beginPath();
          this.autoTargetIndicator.moveTo(this.turretPosition.x, this.turretPosition.y);
          this.autoTargetIndicator.lineTo(targetSprite.x, targetSprite.y);
          this.autoTargetIndicator.strokePath();
        }
      }
    } else {
      if (this.autoTargetText) {
        this.autoTargetText.setVisible(false);
      }
    }

    if (this.targetIcon && this.autoTargetMode && this.currentTarget !== null) {
      const targetFish = this.fishSpriteManager.getFishSprites().get(this.currentTarget);
      if (targetFish) {
        this.targetIcon.setPosition(targetFish.x, targetFish.y);
        this.targetIcon.setVisible(true);
      } else {
        this.targetIcon.setVisible(false);
      }
    } else if (this.targetIcon) {
      this.targetIcon.setVisible(false);
    }
  }
}
