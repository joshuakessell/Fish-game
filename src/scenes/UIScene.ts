import Phaser from "phaser";

export default class UIScene extends Phaser.Scene {
  private creditsText!: Phaser.GameObjects.Text;
  private betValueText!: Phaser.GameObjects.Text;

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

    // Bet value display (bottom-center)
    this.add.rectangle(900, 850, 300, 60, 0x000000, 0.7);
    this.betValueText = this.add.text(900, 850, "Bet: 50 Credits", {
      fontSize: "24px",
      color: "#FFF",
      fontStyle: "bold",
    });
    this.betValueText.setOrigin(0.5);

    // Bet decrease button
    const decreaseBtn = this.add.rectangle(750, 850, 60, 60, 0x990000);
    decreaseBtn.setInteractive({ useHandCursor: true });
    const decreaseText = this.add.text(750, 850, "-", {
      fontSize: "32px",
      color: "#FFF",
      fontStyle: "bold",
    });
    decreaseText.setOrigin(0.5);

    decreaseBtn.on("pointerdown", () => {
      this.adjustBet(-10);
    });

    // Bet increase button
    const increaseBtn = this.add.rectangle(1050, 850, 60, 60, 0x009900);
    increaseBtn.setInteractive({ useHandCursor: true });
    const increaseText = this.add.text(1050, 850, "+", {
      fontSize: "32px",
      color: "#FFF",
      fontStyle: "bold",
    });
    increaseText.setOrigin(0.5);

    increaseBtn.on("pointerdown", () => {
      this.adjustBet(10);
    });

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

  private adjustBet(amount: number) {
    // TODO: Integrate with game state
    console.log(`UIScene: Adjusting bet by ${amount}`);
  }

  public updateCredits(credits: number) {
    this.creditsText.setText(`Credits: ${credits}`);
  }

  public updateBetValue(bet: number) {
    this.betValueText.setText(`Bet: ${bet} Credits`);
  }
}
