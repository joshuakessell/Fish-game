import Phaser from "phaser";

export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    console.log("BootScene: Preloading assets...");

    // TODO: Load sprite sheets, texture atlases, sounds
    // this.load.atlas('fish', 'assets/fish.png', 'assets/fish.json');
    // this.load.image('turret', 'assets/turret.png');
    // this.load.image('bullet', 'assets/bullet.png');
  }

  create() {
    console.log("BootScene: Assets loaded, transitioning to Login");

    // Transition to login scene
    this.scene.start("LoginScene");
  }
}
