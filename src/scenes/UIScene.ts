import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  private creditsText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "UIScene" });
  }

  create() {
    console.log("UIScene: Creating UI overlay");

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
