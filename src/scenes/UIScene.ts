import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    console.log("UIScene: Creating UI overlay");
    // UIScene is now minimal - all UI is handled by BettingUI and GameScene debug overlay
  }
}
