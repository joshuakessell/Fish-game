import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
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

  create() {
    console.log("BootScene: Assets loaded, transitioning to Login");

    // Transition to login scene
    this.scene.start("LoginScene");
  }
}
