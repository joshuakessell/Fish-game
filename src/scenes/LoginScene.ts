import Phaser from 'phaser';

export default class LoginScene extends Phaser.Scene {
  constructor() {
    super({ key: 'LoginScene' });
  }

  create() {
    console.log('LoginScene: Creating login UI');
    
    // Ocean gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);
    
    // Title
    const title = this.add.text(900, 200, 'OCEAN KING 3', {
      fontSize: '80px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 8,
    });
    title.setOrigin(0.5);
    
    // Subtitle
    const subtitle = this.add.text(900, 300, 'Multiplayer Fishing Casino', {
      fontSize: '32px',
      color: '#FFF',
    });
    subtitle.setOrigin(0.5);
    
    // Guest login button
    const loginButton = this.add.rectangle(900, 500, 300, 80, 0x00aa00);
    loginButton.setInteractive({ useHandCursor: true });
    
    const loginText = this.add.text(900, 500, 'Play as Guest', {
      fontSize: '32px',
      color: '#FFF',
      fontStyle: 'bold',
    });
    loginText.setOrigin(0.5);
    
    // Button hover effects
    loginButton.on('pointerover', () => {
      loginButton.setFillStyle(0x00dd00);
    });
    
    loginButton.on('pointerout', () => {
      loginButton.setFillStyle(0x00aa00);
    });
    
    // Click handler
    loginButton.on('pointerdown', () => {
      this.handleGuestLogin();
    });
  }
  
  private async handleGuestLogin() {
    console.log('LoginScene: Guest login clicked');
    
    // TODO: Call backend API for JWT token
    // For now, simulate successful login
    const guestName = 'Player' + Math.floor(Math.random() * 1000);
    
    // Store auth data globally (will add proper state management later)
    (window as any).playerAuth = {
      name: guestName,
      userId: 'guest-' + Date.now(),
      credits: 1000,
      isGuest: true,
    };
    
    console.log('LoginScene: Login successful, transitioning to Lobby');
    this.scene.start('LobbyScene');
  }
}
