import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  private creditsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    console.log("UIScene: Creating UI overlay");

    // Credits display (top-right)
    this.add.rectangle(1650, 50, 250, 60, 0x000000, 0.7);
    this.creditsText = this.add.text(1650, 50, "Credits: 1000", {
      fontSize: "24px",
      color: "#FFD700",
      fontStyle: "bold",
    });
    this.creditsText.setOrigin(0.5);

    // FPS counter (debug)
    const fpsText = this.add.text(10, 10, "FPS: 60", {
      fontSize: "16px",
      color: "#FFF",
    });

    this.time.addEvent({
      delay: 100,
      callback: () => {
        fpsText.setText(`FPS: ${Math.round(this.game.loop.actualFps)}`);
      },
      loop: true,
    });
  }

  public updateCredits(credits: number) {
    this.creditsText.setText(`Credits: ${credits}`);
  }
}
