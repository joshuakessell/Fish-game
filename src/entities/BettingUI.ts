import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export class BettingUI extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private seat: number;

  private minusButton!: Phaser.GameObjects.Graphics;
  private plusButton!: Phaser.GameObjects.Graphics;
  private betCircle!: Phaser.GameObjects.Graphics;
  private betText!: Phaser.GameObjects.Text;
  private betLabelText!: Phaser.GameObjects.Text;
  private bankText!: Phaser.GameObjects.Text;
  private playerNameText!: Phaser.GameObjects.Text;

  private minusHitArea!: Phaser.GameObjects.Zone;
  private plusHitArea!: Phaser.GameObjects.Zone;

  private debounceTimer: number | null = null;
  private readonly DEBOUNCE_MS = 90;

  constructor(scene: Phaser.Scene, x: number, y: number, seat: number) {
    super(scene, x, y);
    this.gameState = GameState.getInstance();
    this.seat = seat;

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

    // Bottom shadow layer for depth
    container.fillStyle(0x8B6914, 0.7);
    container.fillEllipse(0, 4, 520, 95);

    // Outer dark golden rim
    container.fillStyle(0x996600, 1);
    container.fillEllipse(0, 0, 520, 95);

    // Mid-layer beveled edge
    container.fillStyle(0xCC8800, 1);
    container.fillEllipse(0, 0, 505, 88);

    // Inner golden platform
    container.fillStyle(0xFFAA00, 0.95);
    container.fillEllipse(0, 0, 490, 82);

    // Center highlight
    container.fillStyle(0xFFCC33, 0.3);
    container.fillEllipse(0, -8, 460, 70);

    // Dark outline
    container.lineStyle(3, 0x8B6914, 1);
    container.strokeEllipse(0, 0, 520, 95);

    // Light inner highlight
    container.lineStyle(2, 0xFFDD77, 0.6);
    container.strokeEllipse(0, -2, 470, 78);

    this.add(container);
  }

  private createMinusButton() {
    this.minusButton = this.scene.add.graphics();

    // Outer shadow
    this.minusButton.fillStyle(0x002244, 0.5);
    this.minusButton.fillCircle(-70, 2, 36);

    // Main circle
    this.minusButton.fillStyle(0x0066CC, 1);
    this.minusButton.fillCircle(-70, 0, 34);

    // Inner highlight
    this.minusButton.fillStyle(0x0088EE, 0.6);
    this.minusButton.fillCircle(-70, -4, 30);

    // Border
    this.minusButton.lineStyle(3, 0x003377, 1);
    this.minusButton.strokeCircle(-70, 0, 34);

    const minusText = this.scene.add.text(-70, 0, "-", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    minusText.setOrigin(0.5, 0.5);

    this.minusHitArea = this.scene.add.zone(-70, 0, 68, 68);
    this.minusHitArea.setInteractive({ useHandCursor: true });

    this.minusHitArea.on("pointerdown", () => {
      if (this.gameState.decreaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.minusButton, -70, 0);
        this.sendBetValueToServer();
      }
    });

    this.minusHitArea.on("pointerover", () => {
      if (this.gameState.currentBet > this.gameState.MIN_BET) {
        this.redrawButton(this.minusButton, -70, 0, true);
      }
    });

    this.minusHitArea.on("pointerout", () => {
      this.redrawButton(this.minusButton, -70, 0, false);
    });

    this.add([this.minusButton, minusText, this.minusHitArea]);
  }

  private createBetDisplay() {
    // Blue medallion circle
    this.betCircle = this.scene.add.graphics();
    
    // Outer glow
    this.betCircle.fillStyle(0x003377, 0.6);
    this.betCircle.fillCircle(0, 0, 48);
    
    // Main blue circle
    this.betCircle.fillStyle(0x0066CC, 1);
    this.betCircle.fillCircle(0, 0, 42);
    
    // Inner highlight
    this.betCircle.fillStyle(0x0088EE, 0.7);
    this.betCircle.fillCircle(0, -5, 38);
    
    // Border
    this.betCircle.lineStyle(3, 0x003377, 1);
    this.betCircle.strokeCircle(0, 0, 42);

    // Bet amount text (centered in circle)
    this.betText = this.scene.add.text(
      0,
      0,
      this.gameState.currentBet.toString(),
      {
        fontSize: "36px",
        color: "#FFFFFF",
        fontStyle: "bold",
      },
    );
    this.betText.setOrigin(0.5, 0.5);

    // Red "Bet: X Credits" label below the circle
    const betLabelBg = this.scene.add.graphics();
    betLabelBg.fillStyle(0xCC0000, 0.9);
    betLabelBg.fillRoundedRect(-80, 48, 160, 28, 6);
    betLabelBg.lineStyle(2, 0x880000, 1);
    betLabelBg.strokeRoundedRect(-80, 48, 160, 28, 6);

    this.betLabelText = this.scene.add.text(0, 62, `Bet: ${this.gameState.currentBet} Credits`, {
      fontSize: "16px",
      color: "#FFFFFF",
      fontStyle: "bold",
    });
    this.betLabelText.setOrigin(0.5, 0.5);

    this.add([this.betCircle, this.betText, betLabelBg, this.betLabelText]);
  }

  private createPlusButton() {
    this.plusButton = this.scene.add.graphics();

    // Outer shadow
    this.plusButton.fillStyle(0x002244, 0.5);
    this.plusButton.fillCircle(70, 2, 36);

    // Main circle
    this.plusButton.fillStyle(0x0066CC, 1);
    this.plusButton.fillCircle(70, 0, 34);

    // Inner highlight
    this.plusButton.fillStyle(0x0088EE, 0.6);
    this.plusButton.fillCircle(70, -4, 30);

    // Border
    this.plusButton.lineStyle(3, 0x003377, 1);
    this.plusButton.strokeCircle(70, 0, 34);

    const plusText = this.scene.add.text(70, 0, "+", {
      fontSize: "48px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    plusText.setOrigin(0.5, 0.5);

    this.plusHitArea = this.scene.add.zone(70, 0, 68, 68);
    this.plusHitArea.setInteractive({ useHandCursor: true });

    this.plusHitArea.on("pointerdown", () => {
      if (this.gameState.increaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.plusButton, 70, 0);
        this.sendBetValueToServer();
      }
    });

    this.plusHitArea.on("pointerover", () => {
      if (this.gameState.currentBet < this.gameState.MAX_BET) {
        this.redrawButton(this.plusButton, 70, 0, true);
      }
    });

    this.plusHitArea.on("pointerout", () => {
      this.redrawButton(this.plusButton, 70, 0, false);
    });

    this.add([this.plusButton, plusText, this.plusHitArea]);
  }

  private redrawButton(button: Phaser.GameObjects.Graphics, x: number, y: number, hover: boolean) {
    button.clear();
    
    const mainColor = hover ? 0x0088EE : 0x0066CC;
    const highlightColor = hover ? 0x00AAFF : 0x0088EE;
    
    // Outer shadow
    button.fillStyle(0x002244, 0.5);
    button.fillCircle(x, y + 2, 36);

    // Main circle
    button.fillStyle(mainColor, 1);
    button.fillCircle(x, y, 34);

    // Inner highlight
    button.fillStyle(highlightColor, 0.6);
    button.fillCircle(x, y - 4, 30);

    // Border
    button.lineStyle(3, 0x003377, 1);
    button.strokeCircle(x, y, 34);
  }

  private createBankDisplay() {
    const credits = this.gameState.playerAuth?.credits || 0;
    const formattedCredits = this.formatNumber(credits);

    this.bankText = this.scene.add.text(-210, 0, formattedCredits, {
      fontSize: "28px",
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
    nameBg.fillStyle(0x8B4513, 0.9);
    nameBg.fillRoundedRect(140, -20, 140, 40, 10);
    nameBg.lineStyle(3, 0xFFAA00, 1);
    nameBg.strokeRoundedRect(140, -20, 140, 40, 10);

    this.playerNameText = this.scene.add.text(210, 0, playerName, {
      fontSize: "22px",
      color: "#FFE4B5",
      fontStyle: "bold",
    });
    this.playerNameText.setOrigin(0.5, 0.5);

    this.add([nameBg, this.playerNameText]);
  }

  private updateBetDisplay() {
    this.betText.setText(this.gameState.currentBet.toString());
    
    // Update the bet label text
    if (this.betLabelText) {
      this.betLabelText.setText(`Bet: ${this.gameState.currentBet} Credits`);
    }
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
    // Brief press feedback: redraw with pressed state, then restore
    this.redrawButton(button, x, 0, true);
    
    this.scene.time.delayedCall(80, () => {
      this.redrawButton(button, x, 0, false);
    });
  }
}
