import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { PlayerData } from "../types/GameTypes";
import LedgerScene from "../scenes/LedgerScene";

export class PlayersDisplayUI {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private playerDisplays: Map<number, Phaser.GameObjects.Container> = new Map();

  // Player slot positions (matching turret layout)
  private readonly SLOT_POSITIONS = [
    { x: 0.12 * 1800, y: 810 }, // Slot 0: Bottom Left
    { x: 0.5 * 1800, y: 810 }, // Slot 1: Bottom Center
    { x: 0.88 * 1800, y: 810 }, // Slot 2: Bottom Right
    { x: 0.12 * 1800, y: 90 }, // Slot 3: Top Left
    { x: 0.5 * 1800, y: 90 }, // Slot 4: Top Center
    { x: 0.88 * 1800, y: 90 }, // Slot 5: Top Right
  ];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.gameState = GameState.getInstance();

    // Listen for player updates
    this.setupUpdateHandlers();
  }

  private setupUpdateHandlers() {
    // Update displays when credits change
    this.gameState.onCreditsChanged = () => {
      this.updateAllDisplays();
    };
  }

  public updateAllDisplays() {
    // Get all players from game state
    const players = Array.from(this.gameState.players.values());

    // Remove displays for players no longer present
    for (const [slot, display] of this.playerDisplays) {
      if (!this.gameState.players.has(slot)) {
        display.destroy();
        this.playerDisplays.delete(slot);
      }
    }

    // Create or update displays for each player
    for (const player of players) {
      if (!this.playerDisplays.has(player.slot)) {
        this.createPlayerDisplay(player);
      } else {
        this.updatePlayerDisplay(player);
      }
    }
  }

  private createPlayerDisplay(player: PlayerData) {
    const pos = this.SLOT_POSITIONS[player.slot];
    if (!pos) return;

    const container = this.scene.add.container(pos.x, pos.y);

    // Background
    const bg = this.scene.add.rectangle(0, 0, 180, 60, 0x000000, 0.75);
    bg.setStrokeStyle(2, 0xffd700);

    // Player name
    const nameText = this.scene.add.text(0, -12, player.name, {
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    nameText.setOrigin(0.5);

    // Credits text
    const creditsText = this.scene.add.text(
      0,
      12,
      `$${player.credits.toLocaleString()}`,
      {
        fontSize: "18px",
        color: "#FFD700",
        fontStyle: "bold",
      },
    );
    creditsText.setOrigin(0.5);

    container.add([bg, nameText, creditsText]);
    container.setDepth(50);

    // Store references for updates
    container.setData("nameText", nameText);
    container.setData("creditsText", creditsText);
    container.setData("bg", bg);
    container.setData("playerSlot", player.slot);

    // Make clickable with access control
    this.makeClickable(container, player);

    this.playerDisplays.set(player.slot, container);
  }

  private updatePlayerDisplay(player: PlayerData) {
    const container = this.playerDisplays.get(player.slot);
    if (!container) return;

    const nameText = container.getData("nameText") as Phaser.GameObjects.Text;
    const creditsText = container.getData(
      "creditsText",
    ) as Phaser.GameObjects.Text;

    nameText.setText(player.name);
    creditsText.setText(`$${player.credits.toLocaleString()}`);
  }

  private makeClickable(
    container: Phaser.GameObjects.Container,
    player: PlayerData,
  ) {
    const bg = container.getData("bg") as Phaser.GameObjects.Rectangle;

    // Determine if this player's ledger can be viewed
    const canView = this.canViewLedger(player.slot);

    if (!canView) {
      // Not clickable - show as disabled
      return;
    }

    // Make interactive
    bg.setInteractive({ useHandCursor: true });

    bg.on("pointerover", () => {
      bg.setStrokeStyle(3, 0x00ff00);
      bg.setAlpha(0.9);
    });

    bg.on("pointerout", () => {
      bg.setStrokeStyle(2, 0xffd700);
      bg.setAlpha(0.75);
    });

    bg.on("pointerdown", () => {
      this.openLedger(player.slot);
    });
  }

  private canViewLedger(playerSlot: number): boolean {
    // In spectator mode (no player slot assigned), can view all ledgers
    if (this.gameState.myPlayerSlot === null) {
      return true;
    }

    // In player mode, can only view own ledger
    return playerSlot === this.gameState.myPlayerSlot;
  }

  private openLedger(playerSlot: number) {
    // Get the ledger scene and show the ledger for this player
    const ledgerScene = this.scene.scene.get("LedgerScene") as LedgerScene;
    if (ledgerScene) {
      ledgerScene.showLedger(playerSlot);
    }
  }

  public destroy() {
    for (const display of this.playerDisplays.values()) {
      display.destroy();
    }
    this.playerDisplays.clear();
  }
}
