import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  // DEV MODE: Skip login/lobby and auto-join game with seat 1
  private readonly DEV_MODE = false;

  private logo!: Phaser.GameObjects.Image;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBarBg!: Phaser.GameObjects.Graphics;
  private loadingText!: Phaser.GameObjects.Text;
  private tapToContinueText!: Phaser.GameObjects.Text;
  private isLoadingComplete = false;
  private canContinue = false;

  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    console.log('BootScene: Preloading assets...');

    // Create loading UI first (before assets load)
    this.createLoadingUI();

    // Track loading progress
    this.load.on('progress', (progress: number) => {
      this.updateProgressBar(progress);
    });

    // Add error handler for asset loading
    this.load.on('loaderror', (file: any) => {
      console.error(`BootScene: Failed to load asset: ${file.key} from ${file.url}`);
    });

    this.load.on('complete', () => {
      console.log('BootScene: All assets loaded successfully');
      this.isLoadingComplete = true;
      this.onLoadingComplete();
    });

    // Load Ocean Attack logo first (needed for loading screen)
    this.load.image('ocean-attack-logo', 'assets/ocean-attack-logo.png');

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
  }

  async create() {
    console.log('BootScene: Assets loaded');

    // Create swim animations for each fish type
    this.createFishAnimations();

    // Logo is already displayed from preload, just need to wait for user interaction
    // The tap-to-continue flow is handled by onLoadingComplete() which was called in preload
  }

  private createLoadingUI(): void {
    // Black background
    const bg = this.add.rectangle(900, 450, 1800, 900, 0x000000);
    bg.setOrigin(0.5);

    // Ocean Attack logo (centered)
    // Note: Logo will be loaded async, so we'll add it in create() when it's ready
    this.loadingText = this.add.text(900, 450, 'Loading...', {
      fontSize: '32px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    this.loadingText.setOrigin(0.5);

    // Progress bar background (below logo position)
    const barWidth = 400;
    const barHeight = 30;
    const barX = 900 - barWidth / 2;
    const barY = 600;

    this.progressBarBg = this.add.graphics();
    this.progressBarBg.fillStyle(0x222222, 1);
    this.progressBarBg.fillRoundedRect(barX, barY, barWidth, barHeight, 15);
    this.progressBarBg.lineStyle(3, 0xFFD700, 1);
    this.progressBarBg.strokeRoundedRect(barX, barY, barWidth, barHeight, 15);

    // Progress bar (fill)
    this.progressBar = this.add.graphics();

    // Tap to continue text (hidden initially)
    this.tapToContinueText = this.add.text(900, 620, 'Tap to Continue', {
      fontSize: '28px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    this.tapToContinueText.setOrigin(0.5);
    this.tapToContinueText.setAlpha(0); // Start hidden

    console.log('BootScene: Loading UI created');
  }

  private updateProgressBar(progress: number): void {
    const barWidth = 400;
    const barHeight = 30;
    const barX = 900 - barWidth / 2;
    const barY = 600;

    // Clear and redraw progress bar
    this.progressBar.clear();
    this.progressBar.fillStyle(0xFFD700, 1);
    this.progressBar.fillRoundedRect(barX, barY, barWidth * progress, barHeight, 15);

    // Update loading text
    this.loadingText.setText(`Loading... ${Math.floor(progress * 100)}%`);
  }

  private onLoadingComplete(): void {
    console.log('BootScene: Loading complete, fading to tap-to-continue');

    // Add the logo now that it's loaded
    if (this.textures.exists('ocean-attack-logo')) {
      this.logo = this.add.image(900, 300, 'ocean-attack-logo');
      this.logo.setScale(0.4); // Adjust scale as needed
      this.logo.setOrigin(0.5);
    }

    // Hide loading text
    this.loadingText.setVisible(false);

    // Fade out progress bar (slow fade over 800ms)
    this.tweens.add({
      targets: [this.progressBar, this.progressBarBg],
      alpha: 0,
      duration: 800,
      ease: 'Power2',
      onComplete: () => {
        // Fade in "Tap to Continue" (slow fade over 600ms)
        this.tweens.add({
          targets: this.tapToContinueText,
          alpha: 1,
          duration: 600,
          ease: 'Power2',
          onComplete: () => {
            // Enable tap to continue
            this.canContinue = true;
            this.input.once('pointerdown', () => this.onTapToContinue());
          },
        });
      },
    });
  }

  private async onTapToContinue(): Promise<void> {
    if (!this.canContinue) return;

    console.log('BootScene: User tapped, fading out and transitioning');
    this.canContinue = false; // Prevent multiple taps

    // Fade out everything (logo and tap text) - guard against missing logo
    const tweenTargets = this.logo ? [this.logo, this.tapToContinueText] : [this.tapToContinueText];
    this.tweens.add({
      targets: tweenTargets,
      alpha: 0,
      duration: 500,
      ease: 'Power2',
      onComplete: async () => {
        // Transition to next scene based on DEV_MODE
        if (this.DEV_MODE) {
          console.log('BootScene: DEV_MODE enabled - auto-joining game');
          await this.devModeAutoJoin();
        } else {
          console.log('BootScene: Transitioning to Lobby (skip login)');
          // Auto-login as guest and go to lobby
          await this.autoGuestLogin();
        }
      },
    });
  }

  private async autoGuestLogin(): Promise<void> {
    const { GameState } = await import('../systems/GameState');
    const gameState = GameState.getInstance();

    // Auto guest login with random name
    const guestName = 'Player' + Math.floor(Math.random() * 10000);
    console.log(`BootScene: Auto-logging in as ${guestName}`);

    const loginSuccess = await gameState.guestLogin(guestName);
    if (!loginSuccess) {
      console.error('BootScene: Auto guest login failed');
      return;
    }

    // Connect to SignalR
    console.log('BootScene: Connecting to SignalR');
    const connected = await gameState.connectToSignalR();
    if (!connected) {
      console.error('BootScene: SignalR connection failed');
      return;
    }

    console.log('BootScene: Auth complete, transitioning to Lobby');
    this.scene.start('LobbyScene');
  }

  private createFishAnimations() {
    const fishTypes = [0, 1, 2, 6, 9, 12, 14, 21];

    fishTypes.forEach((typeId) => {
      const key = `fish-${typeId}`;

      // Only create animation if spritesheet was successfully loaded
      if (this.textures.exists(key)) {
        const texture = this.textures.get(key);

        // Check if it's actually a spritesheet (has frames)
        if (texture.frameTotal >= 25) {
          this.anims.create({
            key: `${key}-swim`,
            frames: this.anims.generateFrameNumbers(key, { start: 0, end: 24 }),
            frameRate: 10,
            repeat: -1,
          });
          console.log(`Created animation: ${key}-swim with 25 frames`);
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
