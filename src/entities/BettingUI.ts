import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export class BettingUI extends Phaser.GameObjects.Container {
  private gameState: GameState;

  private minusButton!: Phaser.GameObjects.Graphics;
  private plusButton!: Phaser.GameObjects.Graphics;
  private betText!: Phaser.GameObjects.Text;
  private bankText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;

  private minusHitArea!: Phaser.GameObjects.Zone;
  private plusHitArea!: Phaser.GameObjects.Zone;

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_MS = 90;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    this.gameState = GameState.getInstance();

    this.createUI();
    scene.add.existing(this);
    this.setDepth(90);
  }

  private createUI() {
    this.createGoldenCircularContainer();
    this.createBankDisplay();
    this.createMinusButton();
    this.createBetDisplay();
    this.createPlusButton();
    this.createPlayerNameDisplay();
  }

  private createGoldenCircularContainer() {
    const container = this.scene.add.graphics();

    // Outer golden ring
    container.fillStyle(0xCC8800, 1);
    container.fillEllipse(0, 0, 400, 85);

    // Inner golden platform
    container.fillStyle(0xFFAA00, 0.9);
    container.fillEllipse(0, 0, 390, 78);

    // Dark outline
    container.lineStyle(3, 0x996600, 1);
    container.strokeEllipse(0, 0, 400, 85);

    // Light highlight
    container.lineStyle(2, 0xFFCC33, 0.5);
    container.strokeEllipse(0, 0, 370, 72);

    this.add(container);
  }

  private createMinusButton() {
    this.minusButton = this.scene.add.graphics();

    this.minusButton.fillStyle(0x0055AA, 1);
    this.minusButton.fillCircle(-60, 0, 32);

    this.minusButton.lineStyle(3, 0x003377, 1);
    this.minusButton.strokeCircle(-60, 0, 32);

    const minusText = this.scene.add.text(-60, 0, "-", {
      fontSize: "52px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    minusText.setOrigin(0.5, 0.5);

    this.minusHitArea = this.scene.add.zone(-60, 0, 64, 64);
    this.minusHitArea.setInteractive({ useHandCursor: true });

    this.minusHitArea.on("pointerdown", () => {
      if (this.gameState.decreaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.minusButton, -60, 0);
        this.sendBetValueToServer();
      }
    });

    this.minusHitArea.on("pointerover", () => {
      if (this.gameState.currentBet > this.gameState.MIN_BET) {
        this.minusButton.clear();
        this.minusButton.fillStyle(0x0077DD, 1);
        this.minusButton.fillCircle(-60, 0, 32);
        this.minusButton.lineStyle(3, 0x003377, 1);
        this.minusButton.strokeCircle(-60, 0, 32);
      }
    });

    this.minusHitArea.on("pointerout", () => {
      this.minusButton.clear();
      this.minusButton.fillStyle(0x0055AA, 1);
      this.minusButton.fillCircle(-60, 0, 32);
      this.minusButton.lineStyle(3, 0x003377, 1);
      this.minusButton.strokeCircle(-60, 0, 32);
    });

    this.add([this.minusButton, minusText, this.minusHitArea]);
  }

  private createBetDisplay() {
    this.betText = this.scene.add.text(
      0,
      0,
      this.gameState.currentBet.toString(),
      {
        fontSize: "64px",
        color: "#FFFFFF",
        fontStyle: "bold",
        stroke: "#8B6914",
        strokeThickness: 4,
      },
    );
    this.betText.setOrigin(0.5, 0.5);

    this.add(this.betText);
  }

  private createPlusButton() {
    this.plusButton = this.scene.add.graphics();

    this.plusButton.fillStyle(0x0055AA, 1);
    this.plusButton.fillCircle(60, 0, 32);

    this.plusButton.lineStyle(3, 0x003377, 1);
    this.plusButton.strokeCircle(60, 0, 32);

    const plusText = this.scene.add.text(60, 0, "+", {
      fontSize: "52px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    plusText.setOrigin(0.5, 0.5);

    this.plusHitArea = this.scene.add.zone(60, 0, 64, 64);
    this.plusHitArea.setInteractive({ useHandCursor: true });

    this.plusHitArea.on("pointerdown", () => {
      if (this.gameState.increaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.plusButton, 60, 0);
        this.sendBetValueToServer();
      }
    });

    this.plusHitArea.on("pointerover", () => {
      if (this.gameState.currentBet < this.gameState.MAX_BET) {
        this.plusButton.clear();
        this.plusButton.fillStyle(0x0077DD, 1);
        this.plusButton.fillCircle(60, 0, 32);
        this.plusButton.lineStyle(3, 0x003377, 1);
        this.plusButton.strokeCircle(60, 0, 32);
      }
    });

    this.plusHitArea.on("pointerout", () => {
      this.plusButton.clear();
      this.plusButton.fillStyle(0x0055AA, 1);
      this.plusButton.fillCircle(60, 0, 32);
      this.plusButton.lineStyle(3, 0x003377, 1);
      this.plusButton.strokeCircle(60, 0, 32);
    });

    this.add([this.plusButton, plusText, this.plusHitArea]);
  }

  private createBankDisplay() {
    const credits = this.gameState.playerAuth?.credits || 0;
    const formattedCredits = this.formatNumber(credits);

    this.bankText = this.scene.add.text(-160, 0, formattedCredits, {
      fontSize: "26px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#8B6914",
      strokeThickness: 3,
    });
    this.bankText.setOrigin(0.5, 0.5);

    this.add(this.bankText);
  }

  private createPlayerNameDisplay() {
    const playerName = this.gameState.playerAuth?.name || "Player";

    const nameBg = this.scene.add.graphics();
    nameBg.fillStyle(0x8B4513, 0.85);
    nameBg.fillRoundedRect(110, -20, 130, 40, 8);
    nameBg.lineStyle(2, 0xFFAA00, 1);
    nameBg.strokeRoundedRect(110, -20, 130, 40, 8);

    this.playerNameText = this.scene.add.text(175, 0, playerName, {
      fontSize: "22px",
      color: "#FFE4B5",
      fontStyle: "bold",
    });
    this.playerNameText.setOrigin(0.5, 0.5);

    this.add([nameBg, this.playerNameText]);
  }

  private updateBetDisplay() {
    this.betText.setText(this.gameState.currentBet.toString());
  }

  public updateBankDisplay() {
    const credits = this.gameState.playerAuth?.credits || 0;
    const formattedCredits = this.formatNumber(credits);
    this.bankText.setText(formattedCredits);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString("en-US");
  }

  private sendBetValueToServer() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (this.gameState.connection && this.gameState.isConnected) {
        this.gameState.connection
          .invoke("SetBetValue", this.gameState.currentBet)
          .catch((err) => {
            console.error("Failed to send bet value to server:", err);
          });
        console.log(`Sent bet value to server: ${this.gameState.currentBet}`);
      }
      this.debounceTimer = null;
    }, this.DEBOUNCE_MS);
  }

  private playButtonFeedback(
    button: Phaser.GameObjects.Graphics,
    x: number,
    _y: number,
  ) {
    this.scene.tweens.add({
      targets: button,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
      onUpdate: () => {
        button.clear();
        button.fillStyle(0x0088ee, 1);
        button.fillCircle(x, 0, 30);
        button.lineStyle(2, 0x004499, 1);
        button.strokeCircle(x, 0, 30);
      },
      onComplete: () => {
        button.clear();
        button.fillStyle(0x0066cc, 1);
        button.fillCircle(x, 0, 30);
        button.lineStyle(2, 0x004499, 1);
        button.strokeCircle(x, 0, 30);
      },
    });
  }
}
