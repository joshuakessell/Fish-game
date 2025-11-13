import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  // DEV MODE: Skip login/lobby and auto-join game with seat 1
  private readonly DEV_MODE = true;

  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    console.log("BootScene: Preloading assets...");

    this.load.image("fish-0", "assets/fish/clownfish.png");
    this.load.image("fish-1", "assets/fish/neon_tetra.png");
    this.load.image("fish-2", "assets/fish/butterflyfish.png");
    this.load.image("fish-6", "assets/fish/lionfish.png");
    this.load.image("fish-9", "assets/fish/triggerfish.png");
    this.load.image("fish-12", "assets/fish/hammerhead_shark.png");
    this.load.image("fish-14", "assets/fish/giant_manta_ray.png");
    this.load.image("fish-21", "assets/fish/wave_rider.png");
  }

  async create() {
    console.log("BootScene: Assets loaded");

    if (this.DEV_MODE) {
      console.log("BootScene: DEV_MODE enabled - auto-joining game");
      await this.devModeAutoJoin();
    } else {
      console.log("BootScene: Transitioning to Login");
      this.scene.start("LoginScene");
    }
  }

  private async devModeAutoJoin() {
    const { GameState } = await import("../systems/GameState");
    const gameState = GameState.getInstance();

    // Auto guest login
    const guestName = "DevPlayer" + Math.floor(Math.random() * 1000);
    console.log(`BootScene [DEV]: Logging in as ${guestName}`);
    
    const loginSuccess = await gameState.guestLogin(guestName);
    if (!loginSuccess) {
      console.error("BootScene [DEV]: Guest login failed");
      return;
    }

    // Connect to SignalR
    console.log("BootScene [DEV]: Connecting to SignalR");
    const connected = await gameState.connectToSignalR();
    if (!connected) {
      console.error("BootScene [DEV]: SignalR connection failed");
      return;
    }

    // Store the target seat for GameScene to use
    gameState.devModeSeat = 1;

    console.log("BootScene [DEV]: Auth complete, starting game (room join deferred to GameScene)");
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
