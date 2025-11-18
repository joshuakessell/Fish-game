import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  // DEV MODE: Skip login/lobby and auto-join game with seat 1
  private readonly DEV_MODE = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('BootScene: Preloading assets...');

    // Add error handler for asset loading
    this.load.on('loaderror', (file: any) => {
      console.error(`BootScene: Failed to load asset: ${file.key} from ${file.url}`);
    });

    this.load.on('complete', () => {
      console.log('BootScene: All assets loaded successfully');
    });

    // Load fish spritesheets (will attempt animated versions first)
    this.load.spritesheet('fish-0', 'assets/spritesheets/fish/fish-0.png', {
      frameWidth: 72,
      frameHeight: 32,
    });
    this.load.spritesheet('fish-1', 'assets/spritesheets/fish/fish-1.png', {
      frameWidth: 72,
      frameHeight: 32,
    });
    this.load.spritesheet('fish-2', 'assets/spritesheets/fish/fish-2.png', {
      frameWidth: 80,
      frameHeight: 40,
    });
    this.load.spritesheet('fish-6', 'assets/spritesheets/fish/fish-6.png', {
      frameWidth: 128,
      frameHeight: 56,
    });
    this.load.spritesheet('fish-9', 'assets/spritesheets/fish/fish-9.png', {
      frameWidth: 120,
      frameHeight: 48,
    });
    this.load.spritesheet('fish-12', 'assets/spritesheets/fish/fish-12.png', {
      frameWidth: 160,
      frameHeight: 40,
    });
    this.load.spritesheet('fish-14', 'assets/spritesheets/fish/fish-14.png', {
      frameWidth: 224,
      frameHeight: 96,
    });
    this.load.spritesheet('fish-21', 'assets/spritesheets/fish/fish-21.png', {
      frameWidth: 112,
      frameHeight: 48,
    });

    // Fallback to static images (backward compatibility)
    this.load.image('fish-0-static', 'assets/fish/clownfish.png');
    this.load.image('fish-1-static', 'assets/fish/neon_tetra.png');
    this.load.image('fish-2-static', 'assets/fish/butterflyfish.png');
    this.load.image('fish-6-static', 'assets/fish/lionfish.png');
    this.load.image('fish-9-static', 'assets/fish/triggerfish.png');
    this.load.image('fish-12-static', 'assets/fish/hammerhead_shark.png');
    this.load.image('fish-14-static', 'assets/fish/giant_manta_ray.png');
    this.load.image('fish-21-static', 'assets/fish/wave_rider.png');

    // Load Ocean Attack logo
    this.load.image('ocean-attack-logo', 'assets/ocean-attack-logo.jpg');
  }

  async create() {
    console.log('BootScene: Assets loaded');

    // Create swim animations for each fish type
    this.createFishAnimations();

    if (this.DEV_MODE) {
      console.log('BootScene: DEV_MODE enabled - auto-joining game');
      await this.devModeAutoJoin();
    } else {
      console.log('BootScene: Transitioning to Login');
      this.scene.start('LoginScene');
    }
  }

  private createFishAnimations() {
    const fishTypes = [0, 1, 2, 6, 9, 12, 14, 21];

    fishTypes.forEach((typeId) => {
      const key = `fish-${typeId}`;

      // Only create animation if spritesheet was successfully loaded
      if (this.textures.exists(key)) {
        const texture = this.textures.get(key);

        // Check if it's actually a spritesheet (has frames)
        if (texture.frameTotal > 1) {
          this.anims.create({
            key: `${key}-swim`,
            frames: this.anims.generateFrameNumbers(key, { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1,
          });
          console.log(`Created animation: ${key}-swim with ${texture.frameTotal} frames`);
        } else {
          console.log(`Texture ${key} is static (no animation frames)`);
        }
      } else {
        console.log(`Texture ${key} not loaded, skipping animation`);
      }
    });
  }

  private async devModeAutoJoin() {
    const { GameState } = await import('../systems/GameState');
    const gameState = GameState.getInstance();

    // Auto guest login
    const guestName = 'DevPlayer' + Math.floor(Math.random() * 1000);
    console.log(`BootScene [DEV]: Logging in as ${guestName}`);

    const loginSuccess = await gameState.guestLogin(guestName);
    if (!loginSuccess) {
      console.error('BootScene [DEV]: Guest login failed');
      return;
    }

    // Connect to SignalR
    console.log('BootScene [DEV]: Connecting to SignalR');
    const connected = await gameState.connectToSignalR();
    if (!connected) {
      console.error('BootScene [DEV]: SignalR connection failed');
      return;
    }

    // Store the target seat for GameScene to use
    gameState.devModeSeat = 1;

    console.log('BootScene [DEV]: Auth complete, starting game (room join deferred to GameScene)');
    this.scene.start('GameScene');
    this.scene.launch('UIScene');
  }
}
