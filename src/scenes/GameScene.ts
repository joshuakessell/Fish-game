import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { FishSpriteManager } from '../systems/FishSpriteManager';

export default class GameScene extends Phaser.Scene {
  private gameState: GameState;
  private fishSpriteManager!: FishSpriteManager;
  private bulletSprites: Phaser.GameObjects.Sprite[] = [];
  
  private accumulator = 0;
  private readonly TICK_RATE = 30;
  private readonly MS_PER_TICK = 1000 / 30;
  private currentTick = 0;
  
  private debugText!: Phaser.GameObjects.Text;
  private fpsText!: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'GameScene' });
    this.gameState = GameState.getInstance();
  }

  create() {
    console.log('GameScene: Creating game world');
    
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
    
    this.drawTurretPositions();
    
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleShoot(pointer.x, pointer.y);
    });
    
    console.log('GameScene: Initialization complete');
  }
  
  private generatePlaceholderFishGraphics() {
    const fishTypes = [
      { key: 'fish-small', size: 20, color: 0x00ff00 },
      { key: 'fish-medium', size: 40, color: 0x00aaff },
      { key: 'fish-large', size: 60, color: 0xaa00ff },
      { key: 'fish-boss', size: 100, color: 0xffaa00 },
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
    this.debugText = this.add.text(10, 10, '', {
      fontSize: '16px',
      color: '#ffffff',
      backgroundColor: '#000000',
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
  }
  
  private cleanupSignalR() {
    if (this.gameState.connection) {
      this.gameState.connection.off('StateDelta');
      console.log('GameScene: SignalR handlers cleaned up');
    }
    
    this.gameState.onFishSpawned = null;
    this.gameState.onFishRemoved = null;
    
    if (this.fishSpriteManager) {
      this.fishSpriteManager.clear();
    }
  }
  
  private setupSignalRHandlers() {
    const conn = this.gameState.connection;
    if (!conn) {
      console.error('GameScene: No SignalR connection available');
      return;
    }
    
    console.log('GameScene: SignalR event handlers registered');
  }
  
  update(time: number, delta: number) {
    this.accumulator += delta;
    
    while (this.accumulator >= this.MS_PER_TICK) {
      this.fixedUpdate(this.currentTick);
      this.currentTick++;
      this.accumulator -= this.MS_PER_TICK;
    }
    
    const tickProgress = this.accumulator / this.MS_PER_TICK;
    
    this.updateDebugOverlay(tickProgress);
  }
  
  private fixedUpdate(tick: number) {
    this.fishSpriteManager.updateAllFish(tick);
  }
  
  private updateDebugOverlay(tickProgress: number) {
    const fps = Math.round(this.game.loop.actualFps);
    const activeFish = this.fishSpriteManager.getActiveFishCount();
    const pathMode = this.gameState.fishPathManager.getTrackedFishCount() > 0 ? 'ON' : 'OFF';
    const accumulatorDrift = this.accumulator.toFixed(2);
    
    this.debugText.setText([
      `Current Tick: ${this.currentTick}`,
      `FPS: ${fps}`,
      `Active Fish: ${activeFish}`,
      `Path Mode: ${pathMode}`,
      `Accumulator: ${accumulatorDrift}ms`,
      `Tick Progress: ${(tickProgress * 100).toFixed(1)}%`,
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
  
  private drawTurretPositions() {
    const positions = [
      { x: 0.12 * 1800, y: 90 },   // Top-left
      { x: 0.5 * 1800, y: 90 },    // Top-center
      { x: 0.88 * 1800, y: 90 },   // Top-right
      { x: 0.12 * 1800, y: 810 },  // Bottom-left
      { x: 0.5 * 1800, y: 810 },   // Bottom-center
      { x: 0.88 * 1800, y: 810 },  // Bottom-right
    ];
    
    positions.forEach((pos, idx) => {
      const turret = this.add.circle(pos.x, pos.y, 30, 0xffaa00, 0.5);
      const label = this.add.text(pos.x, pos.y, `P${idx}`, {
        fontSize: '20px',
        color: '#000',
      });
      label.setOrigin(0.5);
    });
  }
  
  private handleShoot(x: number, y: number) {
    console.log(`GameScene: Shooting at (${x}, ${y})`);
    
    // TODO: Send shoot event to server via SignalR
    // TODO: Create bullet sprite with trajectory
    
    // Temporary: Create a simple bullet visual
    const bullet = this.add.circle(900, 450, 8, 0xffff00);
    
    this.tweens.add({
      targets: bullet,
      x: x,
      y: y,
      duration: 1000,
      onComplete: () => {
        bullet.destroy();
      },
    });
  }
}
