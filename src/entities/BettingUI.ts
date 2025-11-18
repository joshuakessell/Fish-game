import Phaser from 'phaser';
import { GameState } from '../systems/GameState';
import { LedgerUI } from '../systems/LedgerUI';

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
    this.createBankDisplay();
    this.createMinusButton();
    this.createBetDisplay();
    this.createPlusButton();
    this.createPlayerNameDisplay();
  }

  private createMinusButton() {
    this.minusButton = this.scene.add.graphics();

    this.minusButton.fillStyle(0x0066cc, 1);
    this.minusButton.fillCircle(-70, 0, 25);

    this.minusButton.lineStyle(2, 0x004499, 1);
    this.minusButton.strokeCircle(-70, 0, 25);

    const minusText = this.scene.add.text(-70, 0, '-', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    minusText.setOrigin(0.5, 0.5);

    this.minusHitArea = this.scene.add.zone(-70, 0, 50, 50);
    this.minusHitArea.setInteractive({ useHandCursor: true });
    this.minusHitArea.setData('isUI', true); // Mark as UI element to prevent firing

    this.minusHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Stop propagation to prevent firing bullets
      pointer.event.stopPropagation();
      
      if (this.gameState.decreaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.minusButton, -100, 0);
        this.sendBetValueToServer();
      }
    });

    this.minusHitArea.on('pointerover', () => {
      if (this.gameState.currentBet > this.gameState.MIN_BET) {
        this.minusButton.clear();
        this.minusButton.fillStyle(0x0088ee, 1);
        this.minusButton.fillCircle(-70, 0, 25);
        this.minusButton.lineStyle(2, 0x004499, 1);
        this.minusButton.strokeCircle(-70, 0, 25);
      }
    });

    this.minusHitArea.on('pointerout', () => {
      this.minusButton.clear();
      this.minusButton.fillStyle(0x0066cc, 1);
      this.minusButton.fillCircle(-70, 0, 25);
      this.minusButton.lineStyle(2, 0x004499, 1);
      this.minusButton.strokeCircle(-70, 0, 25);
    });

    this.add([this.minusButton, minusText, this.minusHitArea]);
  }

  private createBetDisplay() {
    // Create circular background for bet value
    const betCircle = this.scene.add.graphics();
    betCircle.fillStyle(0xb8860b, 1);
    betCircle.fillCircle(0, 0, 45);
    betCircle.fillStyle(0xdaa520, 0.8);
    betCircle.fillCircle(0, 0, 40);
    betCircle.lineStyle(3, 0x8b6914, 1);
    betCircle.strokeCircle(0, 0, 45);

    this.betText = this.scene.add.text(0, 0, this.gameState.currentBet.toString(), {
      fontSize: '40px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 3,
    });
    this.betText.setOrigin(0.5, 0.5);

    this.add([betCircle, this.betText]);
  }

  private createPlusButton() {
    this.plusButton = this.scene.add.graphics();

    this.plusButton.fillStyle(0x0066cc, 1);
    this.plusButton.fillCircle(70, 0, 25);

    this.plusButton.lineStyle(2, 0x004499, 1);
    this.plusButton.strokeCircle(70, 0, 25);

    const plusText = this.scene.add.text(70, 0, '+', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    plusText.setOrigin(0.5, 0.5);

    this.plusHitArea = this.scene.add.zone(70, 0, 50, 50);
    this.plusHitArea.setInteractive({ useHandCursor: true });
    this.plusHitArea.setData('isUI', true); // Mark as UI element to prevent firing

    this.plusHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Stop propagation to prevent firing bullets
      pointer.event.stopPropagation();
      
      if (this.gameState.increaseBet()) {
        this.updateBetDisplay();
        this.playButtonFeedback(this.plusButton, 100, 0);
        this.sendBetValueToServer();
      }
    });

    this.plusHitArea.on('pointerover', () => {
      if (this.gameState.currentBet < this.gameState.MAX_BET) {
        this.plusButton.clear();
        this.plusButton.fillStyle(0x0088ee, 1);
        this.plusButton.fillCircle(70, 0, 25);
        this.plusButton.lineStyle(2, 0x004499, 1);
        this.plusButton.strokeCircle(70, 0, 25);
      }
    });

    this.plusHitArea.on('pointerout', () => {
      this.plusButton.clear();
      this.plusButton.fillStyle(0x0066cc, 1);
      this.plusButton.fillCircle(70, 0, 25);
      this.plusButton.lineStyle(2, 0x004499, 1);
      this.plusButton.strokeCircle(70, 0, 25);
    });

    this.add([this.plusButton, plusText, this.plusHitArea]);
  }

  private createBankDisplay() {
    const bankBg = this.scene.add.graphics();
    bankBg.fillStyle(0x8b4513, 0.8);
    bankBg.fillRoundedRect(-260, -20, 150, 40, 5);
    bankBg.lineStyle(2, 0xdaa520, 1);
    bankBg.strokeRoundedRect(-260, -20, 150, 40, 5);

    const credits = this.gameState.playerAuth?.credits || 0;
    const formattedCredits = this.formatNumber(credits);

    this.bankText = this.scene.add.text(-185, 0, `Bank: ${formattedCredits}`, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.bankText.setOrigin(0.5, 0.5);

    // Make bank display clickable to open ledger
    const bankHitArea = this.scene.add.zone(-185, 0, 150, 40);
    bankHitArea.setInteractive({ useHandCursor: true });
    bankHitArea.setData('isUI', true); // Mark as UI element to prevent firing

    bankHitArea.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      // Stop propagation to prevent firing bullets
      pointer.event.stopPropagation();
      
      console.log('📊 Bank display clicked - opening ledger');
      const ledger = LedgerUI.getInstance();
      ledger.toggle();
    });

    bankHitArea.on('pointerover', () => {
      bankBg.clear();
      bankBg.fillStyle(0xa0522d, 0.9);
      bankBg.fillRoundedRect(-260, -20, 150, 40, 5);
      bankBg.lineStyle(3, 0xffd700, 1);
      bankBg.strokeRoundedRect(-260, -20, 150, 40, 5);
    });

    bankHitArea.on('pointerout', () => {
      bankBg.clear();
      bankBg.fillStyle(0x8b4513, 0.8);
      bankBg.fillRoundedRect(-260, -20, 150, 40, 5);
      bankBg.lineStyle(2, 0xdaa520, 1);
      bankBg.strokeRoundedRect(-260, -20, 150, 40, 5);
    });

    this.add([bankBg, this.bankText, bankHitArea]);
  }

  private createPlayerNameDisplay() {
    const playerName = this.gameState.playerAuth?.name || 'Player';

    const nameBg = this.scene.add.graphics();
    nameBg.fillStyle(0x8b4513, 0.8);
    nameBg.fillRoundedRect(140, -20, 120, 40, 5);
    nameBg.lineStyle(2, 0xdaa520, 1);
    nameBg.strokeRoundedRect(140, -20, 120, 40, 5);

    this.playerNameText = this.scene.add.text(200, 0, playerName, {
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold',
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
    console.log(
      `🏦 [BettingUI] updateBankDisplay called - Credits: ${credits} (formatted: ${formattedCredits})`,
    );
    this.bankText.setText(`Bank: ${formattedCredits}`);
  }

  private formatNumber(num: number): string {
    return num.toLocaleString('en-US');
  }

  private sendBetValueToServer() {
    if (this.debounceTimer !== null) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = window.setTimeout(() => {
      if (this.gameState.connection && this.gameState.isConnected) {
        this.gameState.connection.invoke('SetBetValue', this.gameState.currentBet).catch((err) => {
          console.error('Failed to send bet value to server:', err);
        });
        console.log(`Sent bet value to server: ${this.gameState.currentBet}`);
      }
      this.debounceTimer = null;
    }, this.DEBOUNCE_MS);
  }

  private playButtonFeedback(button: Phaser.GameObjects.Graphics, x: number, _y: number) {
    const adjustedX = x < 0 ? -70 : 70;

    this.scene.tweens.add({
      targets: button,
      scaleX: 0.9,
      scaleY: 0.9,
      duration: 50,
      yoyo: true,
      onUpdate: () => {
        button.clear();
        button.fillStyle(0x0088ee, 1);
        button.fillCircle(adjustedX, 0, 25);
        button.lineStyle(2, 0x004499, 1);
        button.strokeCircle(adjustedX, 0, 25);
      },
      onComplete: () => {
        button.clear();
        button.fillStyle(0x0066cc, 1);
        button.fillCircle(adjustedX, 0, 25);
        button.lineStyle(2, 0x004499, 1);
        button.strokeCircle(adjustedX, 0, 25);
      },
    });
  }
}
