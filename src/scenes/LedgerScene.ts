import Phaser from "phaser";
import { GameState } from "../systems/GameState";
import { LedgerEntry, TransactionType } from "../types/LedgerTypes";

export default class LedgerScene extends Phaser.Scene {
  private gameState: GameState;
  private currentPlayerSlot: number | null = null;
  private currentPage: number = 1;
  private readonly ITEMS_PER_PAGE = 15;

  // UI elements
  private modalBg!: Phaser.GameObjects.Rectangle;
  private contentBg!: Phaser.GameObjects.Rectangle;
  private titleText!: Phaser.GameObjects.Text;
  private tableContainer!: Phaser.GameObjects.Container;
  private pageInfoText!: Phaser.GameObjects.Text;
  private prevButton!: Phaser.GameObjects.Container;
  private nextButton!: Phaser.GameObjects.Container;
  private closeButton!: Phaser.GameObjects.Container;

  constructor() {
    super({ key: "LedgerScene" });
    this.gameState = GameState.getInstance();
  }

  create() {
    // Semi-transparent black background overlay
    this.modalBg = this.add.rectangle(900, 450, 1800, 900, 0x000000, 0.7);
    this.modalBg.setInteractive();
    this.modalBg.setDepth(100);

    // Main content background
    this.contentBg = this.add.rectangle(900, 450, 1200, 700, 0x001f3f, 1);
    this.contentBg.setStrokeStyle(3, 0x0066cc);
    this.contentBg.setDepth(101);

    // Title
    this.titleText = this.add.text(900, 150, "Transaction Ledger", {
      fontSize: "36px",
      color: "#FFD700",
      fontStyle: "bold",
    });
    this.titleText.setOrigin(0.5);
    this.titleText.setDepth(102);

    // Table container
    this.tableContainer = this.add.container(0, 0);
    this.tableContainer.setDepth(102);

    // Pagination controls
    this.createPaginationControls();

    // Close button
    this.createCloseButton();

    // Initially hidden
    this.hideAllElements();
  }

  private hideAllElements() {
    this.modalBg.setVisible(false);
    this.contentBg.setVisible(false);
    this.titleText.setVisible(false);
    this.tableContainer.setVisible(false);
    this.pageInfoText.setVisible(false);
    this.prevButton.setVisible(false);
    this.nextButton.setVisible(false);
    this.closeButton.setVisible(false);
  }

  private showAllElements() {
    this.modalBg.setVisible(true);
    this.contentBg.setVisible(true);
    this.titleText.setVisible(true);
    this.tableContainer.setVisible(true);
    this.pageInfoText.setVisible(true);
    this.prevButton.setVisible(true);
    this.nextButton.setVisible(true);
    this.closeButton.setVisible(true);
  }

  private createCloseButton() {
    const x = 1450;
    const y = 150;

    // Button container
    this.closeButton = this.add.container(x, y);

    // Background
    const bg = this.add.circle(0, 0, 25, 0xe74c3c);
    const hoverBg = this.add.circle(0, 0, 25, 0xc0392b);
    hoverBg.setAlpha(0);

    // X text
    const closeText = this.add.text(0, 0, "×", {
      fontSize: "32px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    closeText.setOrigin(0.5);

    this.closeButton.add([bg, hoverBg, closeText]);
    this.closeButton.setSize(50, 50);
    this.closeButton.setInteractive({ useHandCursor: true });
    this.closeButton.setDepth(103);

    this.closeButton.on("pointerover", () => {
      hoverBg.setAlpha(1);
    });

    this.closeButton.on("pointerout", () => {
      hoverBg.setAlpha(0);
    });

    this.closeButton.on("pointerdown", () => {
      this.hideLedger();
    });
  }

  private createPaginationControls() {
    const y = 720;

    // Previous button
    this.prevButton = this.createButton(600, y, "← Previous", 0x3498db);
    this.prevButton.on("pointerdown", () => {
      this.changePage(-1);
    });

    // Next button
    this.nextButton = this.createButton(1200, y, "Next →", 0x3498db);
    this.nextButton.on("pointerdown", () => {
      this.changePage(1);
    });

    // Page info
    this.pageInfoText = this.add.text(900, y, "Page 1 of 1", {
      fontSize: "20px",
      color: "#ffffff",
    });
    this.pageInfoText.setOrigin(0.5);
    this.pageInfoText.setDepth(102);
  }

  private createButton(
    x: number,
    y: number,
    text: string,
    color: number,
  ): Phaser.GameObjects.Container {
    const container = this.add.container(x, y);

    const bg = this.add.rectangle(0, 0, 150, 40, color);
    const hoverBg = this.add.rectangle(0, 0, 150, 40, color);
    hoverBg.setAlpha(0.5);
    hoverBg.setVisible(false);

    const buttonText = this.add.text(0, 0, text, {
      fontSize: "18px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    buttonText.setOrigin(0.5);

    container.add([bg, hoverBg, buttonText]);
    container.setSize(150, 40);
    container.setInteractive({ useHandCursor: true });
    container.setDepth(102);

    container.on("pointerover", () => {
      hoverBg.setVisible(true);
    });

    container.on("pointerout", () => {
      hoverBg.setVisible(false);
    });

    return container;
  }

  public showLedger(playerSlot: number) {
    this.currentPlayerSlot = playerSlot;
    this.currentPage = 1;
    this.showAllElements();
    this.renderLedger();
  }

  public hideLedger() {
    this.hideAllElements();
    this.currentPlayerSlot = null;
  }

  private renderLedger() {
    if (this.currentPlayerSlot === null) return;

    const ledger = this.gameState.getPlayerLedger(this.currentPlayerSlot);
    if (!ledger) {
      this.titleText.setText("No Ledger Data");
      return;
    }

    // Update title with player name
    this.titleText.setText(`${ledger.playerName}'s Ledger`);

    // Clear existing table
    this.tableContainer.removeAll(true);

    const transactions = ledger.transactions;
    const totalPages = Math.ceil(transactions.length / this.ITEMS_PER_PAGE);

    if (totalPages === 0) {
      // No transactions
      const noDataText = this.add.text(900, 450, "No transactions yet", {
        fontSize: "24px",
        color: "#95a5a6",
      });
      noDataText.setOrigin(0.5);
      this.tableContainer.add(noDataText);
      this.pageInfoText.setText("Page 0 of 0");
      this.prevButton.setAlpha(0.5);
      this.nextButton.setAlpha(0.5);
      return;
    }

    // Ensure current page is valid
    this.currentPage = Math.max(1, Math.min(this.currentPage, totalPages));

    // Update pagination info
    this.pageInfoText.setText(`Page ${this.currentPage} of ${totalPages}`);
    this.prevButton.setAlpha(this.currentPage > 1 ? 1 : 0.5);
    this.nextButton.setAlpha(this.currentPage < totalPages ? 1 : 0.5);

    // Get page items (reverse to show newest first)
    const startIdx = (this.currentPage - 1) * this.ITEMS_PER_PAGE;
    const pageItems = transactions
      .slice()
      .reverse()
      .slice(startIdx, startIdx + this.ITEMS_PER_PAGE);

    // Render table header
    const headerY = 220;
    const headers = ["Time", "Type", "Amount", "Balance", "Details"];
    const headerX = [400, 600, 800, 1000, 1200];

    headers.forEach((header, idx) => {
      const headerText = this.add.text(headerX[idx], headerY, header, {
        fontSize: "20px",
        color: "#3498db",
        fontStyle: "bold",
      });
      headerText.setOrigin(0.5);
      this.tableContainer.add(headerText);
    });

    // Render table rows
    let rowY = headerY + 50;
    pageItems.forEach((entry, idx) => {
      const bgColor = idx % 2 === 0 ? 0x001a33 : 0x002040;
      const rowBg = this.add.rectangle(900, rowY, 1100, 35, bgColor, 0.8);
      this.tableContainer.add(rowBg);

      // Time
      const time = new Date(entry.timestamp).toLocaleTimeString();
      const timeText = this.add.text(headerX[0], rowY, time, {
        fontSize: "16px",
        color: "#95a5a6",
      });
      timeText.setOrigin(0.5);
      this.tableContainer.add(timeText);

      // Type
      const typeColor = entry.type === TransactionType.BET ? "#e74c3c" : "#27ae60";
      const typeText = this.add.text(headerX[1], rowY, entry.type, {
        fontSize: "16px",
        color: typeColor,
        fontStyle: "bold",
      });
      typeText.setOrigin(0.5);
      this.tableContainer.add(typeText);

      // Amount
      const amountSign = entry.amount >= 0 ? "+" : "";
      const amountColor = entry.amount >= 0 ? "#27ae60" : "#e74c3c";
      const amountText = this.add.text(
        headerX[2],
        rowY,
        `${amountSign}$${Math.abs(entry.amount)}`,
        {
          fontSize: "16px",
          color: amountColor,
          fontStyle: "bold",
        },
      );
      amountText.setOrigin(0.5);
      this.tableContainer.add(amountText);

      // Balance
      const balanceText = this.add.text(headerX[3], rowY, `$${entry.balance}`, {
        fontSize: "16px",
        color: "#f39c12",
      });
      balanceText.setOrigin(0.5);
      this.tableContainer.add(balanceText);

      // Details
      let details = "-";
      if (entry.fishId !== undefined) {
        details = `Fish #${entry.fishId}`;
        if (entry.multiplier) {
          details += ` (${entry.multiplier}x)`;
        }
      }
      const detailsText = this.add.text(headerX[4], rowY, details, {
        fontSize: "16px",
        color: "#bdc3c7",
      });
      detailsText.setOrigin(0.5);
      this.tableContainer.add(detailsText);

      rowY += 35;
    });
  }

  private changePage(delta: number) {
    if (this.currentPlayerSlot === null) return;

    const ledger = this.gameState.getPlayerLedger(this.currentPlayerSlot);
    if (!ledger) return;

    const totalPages = Math.ceil(
      ledger.transactions.length / this.ITEMS_PER_PAGE,
    );
    const newPage = this.currentPage + delta;

    if (newPage >= 1 && newPage <= totalPages) {
      this.currentPage = newPage;
      this.renderLedger();
    }
  }
}
