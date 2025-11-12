import Phaser from 'phaser';

export default class LobbyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LobbyScene' });
  }

  create() {
    console.log('LobbyScene: Creating lobby UI');
    
    // Ocean gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);
    
    // Title
    const title = this.add.text(900, 80, 'SELECT A ROOM', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    title.setOrigin(0.5);
    
    // TODO: Display room grid (2x2 layout showing 4 rooms)
    // For now, create a single "Join Game" button
    const joinButton = this.add.rectangle(900, 450, 400, 100, 0x0066cc);
    joinButton.setInteractive({ useHandCursor: true });
    
    const joinText = this.add.text(900, 450, 'Join Game (Solo)', {
      fontSize: '36px',
      color: '#FFF',
      fontStyle: 'bold',
    });
    joinText.setOrigin(0.5);
    
    joinButton.on('pointerover', () => {
      joinButton.setFillStyle(0x0088ff);
    });
    
    joinButton.on('pointerout', () => {
      joinButton.setFillStyle(0x0066cc);
    });
    
    joinButton.on('pointerdown', () => {
      this.handleJoinGame();
    });
  }
  
  private handleJoinGame() {
    console.log('LobbyScene: Joining game...');
    
    // TODO: Connect to SignalR, join room, select seat
    // For now, transition directly to game scene
    this.scene.start('GameScene');
    this.scene.launch('UIScene'); // Launch UI overlay
  }
}
