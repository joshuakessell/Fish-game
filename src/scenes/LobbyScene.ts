import Phaser from 'phaser';
import { GameState } from '../systems/GameState';

export default class LobbyScene extends Phaser.Scene {
  private gameState: GameState;
  
  constructor() {
    super({ key: 'LobbyScene' });
    this.gameState = GameState.getInstance();
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
  
  private async handleJoinGame() {
    console.log('LobbyScene: Joining game...');
    
    // For now, join room "match_1" at seat 0 (solo mode)
    const roomId = 'match_1';
    const seat = 0;
    
    const joined = await this.gameState.joinRoom(roomId, seat);
    
    if (!joined) {
      console.error('LobbyScene: Failed to join room');
      // TODO: Show error message to user
      return;
    }
    
    console.log('LobbyScene: Successfully joined room, starting game');
    this.scene.start('GameScene');
    this.scene.launch('UIScene'); // Launch UI overlay
  }
}
