import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

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
    this.createMinusButton();
    this.createBetDisplay();
    this.createPlusButton();
    this.createBankDisplay();
    this.createPlayerNameDisplay();
  }
  
  private createGoldenCircularContainer() {
    const container = this.scene.add.graphics();
    
    container.fillStyle(0xB8860B, 1);
    container.fillEllipse(0, 0, 280, 80);
    
    container.fillStyle(0xDAA520, 0.8);
    container.fillEllipse(0, 0, 260, 70);
    
    container.lineStyle(3, 0x8B6914, 1);
    container.strokeEllipse(0, 0, 280, 80);
    
    this.add(container);
  }
  
  private createMinusButton() {
    this.minusButton = this.scene.add.graphics();
    
    this.minusButton.fillStyle(0x0066cc, 1);
    this.minusButton.fillCircle(-100, 0, 30);
    
    this.minusButton.lineStyle(2, 0x004499, 1);
    this.minusButton.strokeCircle(-100, 0, 30);
    
    const minusText = this.scene.add.text(-100, 0, '-', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    minusText.setOrigin(0.5, 0.5);
    
    this.minusHitArea = this.scene.add.zone(-100, 0, 60, 60);
    this.minusHitArea.setInteractive({ useHandCursor: true });
    
    this.minusHitArea.on('pointerdown', () => {
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
        this.minusButton.fillCircle(-100, 0, 30);
        this.minusButton.lineStyle(2, 0x004499, 1);
        this.minusButton.strokeCircle(-100, 0, 30);
      }
    });
    
    this.minusHitArea.on('pointerout', () => {
      this.minusButton.clear();
      this.minusButton.fillStyle(0x0066cc, 1);
      this.minusButton.fillCircle(-100, 0, 30);
      this.minusButton.lineStyle(2, 0x004499, 1);
      this.minusButton.strokeCircle(-100, 0, 30);
    });
    
    this.add([this.minusButton, minusText, this.minusHitArea]);
  }
  
  private createBetDisplay() {
    this.betText = this.scene.add.text(0, 0, this.gameState.currentBet.toString(), {
      fontSize: '56px',
      color: '#ffffff',
      fontStyle: 'bold',
      stroke: '#8B6914',
      strokeThickness: 3,
    });
    this.betText.setOrigin(0.5, 0.5);
    
    this.add(this.betText);
  }
  
  private createPlusButton() {
    this.plusButton = this.scene.add.graphics();
    
    this.plusButton.fillStyle(0x0066cc, 1);
    this.plusButton.fillCircle(100, 0, 30);
    
    this.plusButton.lineStyle(2, 0x004499, 1);
    this.plusButton.strokeCircle(100, 0, 30);
    
    const plusText = this.scene.add.text(100, 0, '+', {
      fontSize: '48px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    plusText.setOrigin(0.5, 0.5);
    
    this.plusHitArea = this.scene.add.zone(100, 0, 60, 60);
    this.plusHitArea.setInteractive({ useHandCursor: true });
    
    this.plusHitArea.on('pointerdown', () => {
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
        this.plusButton.fillCircle(100, 0, 30);
        this.plusButton.lineStyle(2, 0x004499, 1);
        this.plusButton.strokeCircle(100, 0, 30);
      }
    });
    
    this.plusHitArea.on('pointerout', () => {
      this.plusButton.clear();
      this.plusButton.fillStyle(0x0066cc, 1);
      this.plusButton.fillCircle(100, 0, 30);
      this.plusButton.lineStyle(2, 0x004499, 1);
      this.plusButton.strokeCircle(100, 0, 30);
    });
    
    this.add([this.plusButton, plusText, this.plusHitArea]);
  }
  
  private createBankDisplay() {
    const bankBg = this.scene.add.graphics();
    bankBg.fillStyle(0x000000, 0.6);
    bankBg.fillRoundedRect(-160, 50, 120, 40, 5);
    
    const credits = this.gameState.playerAuth?.credits || 0;
    const formattedCredits = this.formatNumber(credits);
    
    this.bankText = this.scene.add.text(-100, 70, `Bank: ${formattedCredits}`, {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold',
    });
    this.bankText.setOrigin(0.5, 0.5);
    
    this.add([bankBg, this.bankText]);
  }
  
  private createPlayerNameDisplay() {
    const playerName = this.gameState.playerAuth?.name || 'Player';
    
    const nameBg = this.scene.add.graphics();
    nameBg.fillStyle(0x8B4513, 0.8);
    nameBg.fillRoundedRect(140, -20, 120, 40, 5);
    nameBg.lineStyle(2, 0xDAA520, 1);
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
  
  private playButtonFeedback(button: Phaser.GameObjects.Graphics, x: number, y: number) {
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
