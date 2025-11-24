import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export class BettingUI extends Phaser.GameObjects.Container {
  private gameState: GameState;
  private seat: number;

  private minusButton!: Phaser.GameObjects.Graphics;
  private plusButton!: Phaser.GameObjects.Graphics;
  private betCircle!: Phaser.GameObjects.Graphics;
  private betText!: Phaser.GameObjects.Text;
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

    // Total width: 700px (wider to accommodate bank and name)
    // Left section: -320 to -110 (rounded rect for bank)
    // Middle section: -110 to +110 (ellipse for bet controls)
    // Right section: +110 to +320 (rounded rect for player name)

    // Bottom shadow layer for depth (full width)
    container.fillStyle(0x8B6914, 0.7);
    container.fillRoundedRect(-320, 4 - 45, 640, 90, 20); // Shadow under entire platform

    // LEFT SECTION - Rounded rectangle for bank
    // Outer rim
    container.fillStyle(0x996600, 1);
    container.fillRoundedRect(-320, -45, 210, 90, { tl: 20, tr: 5, bl: 20, br: 5 });
    
    // Inner platform
    container.fillStyle(0xFFAA00, 0.95);
    container.fillRoundedRect(-315, -40, 200, 80, { tl: 18, tr: 4, bl: 18, br: 4 });

    // Highlight
    container.fillStyle(0xFFCC33, 0.3);
    container.fillRoundedRect(-315, -48, 200, 70, { tl: 18, tr: 4, bl: 18, br: 4 });

    // MIDDLE SECTION - Ellipse for bet controls
    // Outer dark golden rim
    container.fillStyle(0x996600, 1);
    container.fillEllipse(0, 0, 220, 95);

    // Mid-layer beveled edge
    container.fillStyle(0xCC8800, 1);
    container.fillEllipse(0, 0, 210, 88);

    // Inner golden platform
    container.fillStyle(0xFFAA00, 0.95);
    container.fillEllipse(0, 0, 200, 82);

    // Center highlight
    container.fillStyle(0xFFCC33, 0.3);
    container.fillEllipse(0, -8, 180, 70);

    // RIGHT SECTION - Rounded rectangle for player name
    // Outer rim
    container.fillStyle(0x996600, 1);
    container.fillRoundedRect(110, -45, 210, 90, { tl: 5, tr: 20, bl: 5, br: 20 });
    
    // Inner platform
    container.fillStyle(0xFFAA00, 0.95);
    container.fillRoundedRect(115, -40, 200, 80, { tl: 4, tr: 18, bl: 4, br: 18 });

    // Highlight
    container.fillStyle(0xFFCC33, 0.3);
    container.fillRoundedRect(115, -48, 200, 70, { tl: 4, tr: 18, bl: 4, br: 18 });

    // Dark outline around entire platform
    container.lineStyle(3, 0x8B6914, 1);
    container.strokeRoundedRect(-320, -45, 640, 90, 20);

    // Light inner highlights
    container.lineStyle(2, 0xFFDD77, 0.6);
    container.strokeEllipse(0, -2, 190, 78); // Middle section
    container.strokeRoundedRect(-315, -42, 200, 84, { tl: 18, tr: 4, bl: 18, br: 4 }); // Left section
    container.strokeRoundedRect(115, -42, 200, 84, { tl: 4, tr: 18, bl: 4, br: 18 }); // Right section

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

    this.add([this.betCircle, this.betText]);
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

    // Dark shadow/background behind bank text for readability
    const bankBg = this.scene.add.graphics();
    bankBg.fillStyle(0x000000, 0.6);
    bankBg.fillRoundedRect(-290, -18, 140, 36, 8);

    this.bankText = this.scene.add.text(-220, 0, formattedCredits, {
      fontSize: "28px",
      color: "#FFD700",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 4,
    });
    this.bankText.setOrigin(0.5, 0.5);

    this.add([bankBg, this.bankText]);
  }

  private createPlayerNameDisplay() {
    const playerName = this.gameState.playerAuth?.name || "Player";

    // Dark background behind player name (integrated into right section)
    const nameBg = this.scene.add.graphics();
    nameBg.fillStyle(0x000000, 0.5);
    nameBg.fillRoundedRect(130, -18, 170, 36, 8);

    this.playerNameText = this.scene.add.text(215, 0, playerName, {
      fontSize: "22px",
      color: "#FFE4B5",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 3,
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
    // Brief press feedback: redraw with pressed state, then restore
    this.redrawButton(button, x, 0, true);
    
    this.scene.time.delayedCall(80, () => {
      this.redrawButton(button, x, 0, false);
    });
  }
}
