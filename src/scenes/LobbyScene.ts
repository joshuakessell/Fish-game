import Phaser from "phaser";
import { GameState } from "../systems/GameState";

export default class LobbyScene extends Phaser.Scene {
  private gameState: GameState;
  private selectedSeat: number | null = null;
  private occupiedSeats: Set<number> = new Set();
  private seatBoxes: Map<number, Phaser.GameObjects.Rectangle> = new Map();
  private joinButton!: Phaser.GameObjects.Rectangle;
  private joinText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: "LobbyScene" });
    this.gameState = GameState.getInstance();
  }

  create() {
    console.log("LobbyScene: Creating lobby UI");

    // Ocean gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);

    // Title
    const title = this.add.text(900, 100, "SELECT YOUR SEAT", {
      fontSize: "56px",
      color: "#FFD700",
      fontStyle: "bold",
    });
    title.setOrigin(0.5);

    const subtitle = this.add.text(900, 160, "Room: match_1", {
      fontSize: "28px",
      color: "#FFFFFF",
    });
    subtitle.setOrigin(0.5);

    // Draw seat selection UI
    this.createSeatSelection();

    // Join button (initially disabled)
    this.joinButton = this.add.rectangle(900, 750, 400, 80, 0x666666);
    this.joinText = this.add.text(900, 750, "SELECT A SEAT", {
      fontSize: "32px",
      color: "#999999",
      fontStyle: "bold",
    });
    this.joinText.setOrigin(0.5);
  }

  private createSeatSelection() {
    // Seat positions matching game layout
    const seatPositions = [
      { seat: 0, x: 0.12 * 1800, y: 550, label: "Bottom Left" },
      { seat: 1, x: 0.5 * 1800, y: 550, label: "Bottom Center" },
      { seat: 2, x: 0.88 * 1800, y: 550, label: "Bottom Right" },
      { seat: 3, x: 0.12 * 1800, y: 350, label: "Top Left" },
      { seat: 4, x: 0.5 * 1800, y: 350, label: "Top Center" },
      { seat: 5, x: 0.88 * 1800, y: 350, label: "Top Right" },
    ];

    seatPositions.forEach(({ seat, x, y, label }) => {
      const isOccupied = this.occupiedSeats.has(seat);
      const isSelected = this.selectedSeat === seat;

      // Seat container
      let color = 0x0066cc; // Available (blue)
      if (isOccupied) color = 0x666666; // Occupied (gray)
      if (isSelected) color = 0x00ff00; // Selected (green)

      const seatBox = this.add.rectangle(x, y, 200, 120, color, 0.8);
      seatBox.setStrokeStyle(3, 0xffd700);

      if (!isOccupied) {
        this.seatBoxes.set(seat, seatBox);

        seatBox.setInteractive({ useHandCursor: true });

        seatBox.on("pointerover", () => {
          if (this.selectedSeat !== seat) {
            seatBox.setFillStyle(0x0088ff, 0.8);
          }
        });

        seatBox.on("pointerout", () => {
          if (this.selectedSeat !== seat) {
            seatBox.setFillStyle(0x0066cc, 0.8);
          }
        });

        seatBox.on("pointerdown", () => {
          this.selectSeat(seat);
        });
      }

      // Seat number
      const seatNumber = this.add.text(x, y - 20, `SEAT ${seat}`, {
        fontSize: "28px",
        color: "#FFD700",
        fontStyle: "bold",
      });
      seatNumber.setOrigin(0.5);

      // Status text
      const statusText = isOccupied ? "OCCUPIED" : "AVAILABLE";
      const statusColor = isOccupied ? "#FF6666" : "#66FF66";
      const status = this.add.text(x, y + 20, statusText, {
        fontSize: "18px",
        color: statusColor,
      });
      status.setOrigin(0.5);

      // Position label
      const posLabel = this.add.text(x, y + 45, label, {
        fontSize: "14px",
        color: "#AAAAAA",
      });
      posLabel.setOrigin(0.5);
    });
  }

  private selectSeat(seat: number) {
    console.log(`LobbyScene: Selected seat ${seat}`);

    // Update previously selected seat back to blue
    if (this.selectedSeat !== null && this.selectedSeat !== seat) {
      const previousSeatBox = this.seatBoxes.get(this.selectedSeat);
      if (previousSeatBox) {
        previousSeatBox.setFillStyle(0x0066cc, 0.8);
      }
    }

    // Update newly selected seat to green
    const newSeatBox = this.seatBoxes.get(seat);
    if (newSeatBox) {
      newSeatBox.setFillStyle(0x00ff00, 0.8);
    }

    // Track selected seat
    this.selectedSeat = seat;

    // Enable join button
    this.enableJoinButton();
  }

  private enableJoinButton() {
    if (this.joinButton && this.joinText && this.selectedSeat !== null) {
      this.joinButton.setFillStyle(0x00cc00);

      this.joinButton.removeInteractive();
      this.joinButton.setInteractive({ useHandCursor: true });

      this.joinText.setText("JOIN GAME");
      this.joinText.setColor("#FFFFFF");

      this.joinButton.on("pointerover", () => {
        this.joinButton.setFillStyle(0x00ff00);
      });

      this.joinButton.on("pointerout", () => {
        this.joinButton.setFillStyle(0x00cc00);
      });

      this.joinButton.on("pointerdown", () => {
        this.handleJoinGame();
      });
    }
  }

  private async handleJoinGame() {
    if (this.selectedSeat === null) {
      console.error("LobbyScene: No seat selected");
      return;
    }

    console.log(`LobbyScene: Joining game at seat ${this.selectedSeat}...`);

    const roomId = "match_1";
    const joined = await this.gameState.joinRoom(roomId, this.selectedSeat);

    if (!joined) {
      console.error("LobbyScene: Failed to join room");
      return;
    }

    console.log("LobbyScene: Successfully joined room, starting game");
    this.scene.start("GameScene");
    this.scene.launch("UIScene");
  }
}
