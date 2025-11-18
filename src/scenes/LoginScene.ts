import Phaser from 'phaser';

export default class LoginScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;
  private errorText?: Phaser.GameObjects.Text;

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

    // Name input label
    const nameLabel = this.add.text(900, 380, 'Enter Your Name:', {
      fontSize: '28px',
      color: '#FFF',
    });
    nameLabel.setOrigin(0.5);

    // Create HTML input field for name
    this.createNameInput();

    // Error message text (hidden initially)
    this.errorText = this.add.text(900, 540, '', {
      fontSize: '20px',
      color: '#FF4444',
    });
    this.errorText.setOrigin(0.5);

    // Login button
    const loginButton = this.add.rectangle(900, 600, 300, 80, 0x00aa00);
    loginButton.setInteractive({ useHandCursor: true });

    const loginText = this.add.text(900, 600, 'Enter Lobby', {
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
      this.handleLogin();
    });

    // Allow Enter key to submit
    this.nameInput.addEventListener('keypress', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        this.handleLogin();
      }
    });

    // Focus on input
    this.nameInput.focus();
  }

  private createNameInput() {
    console.log('LoginScene: Creating HTML input element');
    // Create HTML input element
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Your Name';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      position: absolute;
      font-size: 28px;
      padding: 12px 20px;
      width: 400px;
      text-align: center;
      border: 3px solid #FFD700;
      border-radius: 8px;
      background: rgba(0, 26, 51, 0.9);
      color: #FFF;
      outline: none;
      font-family: Arial, sans-serif;
      z-index: 1000;
    `;

    // Position the input field
    this.positionNameInput();

    // Add to DOM
    document.body.appendChild(this.nameInput);
    console.log('LoginScene: HTML input appended to DOM', {
      inputExists: !!this.nameInput,
      parentNode: this.nameInput.parentNode?.nodeName,
      position: {
        left: this.nameInput.style.left,
        top: this.nameInput.style.top,
        transform: this.nameInput.style.transform,
      },
    });

    // Reposition on window resize
    this.scale.on('resize', this.positionNameInput, this);
  }

  private positionNameInput() {
    const canvas = this.game.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // Calculate position relative to canvas (centered at y=450 in game coords)
    const scaleX = canvasRect.width / 1800;
    const scaleY = canvasRect.height / 900;

    const centerX = canvasRect.left + (900 * scaleX);
    const centerY = canvasRect.top + (450 * scaleY);

    this.nameInput.style.left = `${centerX}px`;
    this.nameInput.style.top = `${centerY}px`;
    this.nameInput.style.transform = `translate(-50%, -50%) scale(${Math.min(scaleX, scaleY)})`;
  }

  private async handleLogin() {
    try {
      console.log('LoginScene: handleLogin called');
      const playerName = this.nameInput.value.trim();
      console.log(`LoginScene: Name entered: "${playerName}"`);

      // Validate name
      if (playerName.length < 2) {
        this.showError('Name must be at least 2 characters');
        return;
      }

      if (playerName.length > 20) {
        this.showError('Name must be 20 characters or less');
        return;
      }

      console.log(`LoginScene: Logging in as ${playerName}`);

      // Import GameState
      const { GameState } = await import('../systems/GameState');
      const gameState = GameState.getInstance();
      console.log('LoginScene: GameState instance obtained');

      // Perform guest login via backend API
      console.log('LoginScene: Calling guestLogin...');
      const loginSuccess = await gameState.guestLogin(playerName);
      console.log(`LoginScene: guestLogin result: ${loginSuccess}`);

      if (!loginSuccess) {
        this.showError('Login failed. Please try again.');
        return;
      }

      // Connect to SignalR
      console.log('LoginScene: Calling connectToSignalR...');
      const connected = await gameState.connectToSignalR();
      console.log(`LoginScene: connectToSignalR result: ${connected}`);

      if (!connected) {
        this.showError('Connection failed. Please try again.');
        return;
      }

      console.log('LoginScene: Login and SignalR connection successful');

      // Clean up input
      this.cleanupInput();

      console.log('LoginScene: Transitioning to LobbyScene');
      // Transition to lobby
      this.scene.start('LobbyScene');
    } catch (error) {
      console.error('LoginScene: Error during login:', error);
      this.showError('An error occurred. Please try again.');
    }
  }

  private showError(message: string) {
    if (this.errorText) {
      this.errorText.setText(message);
      this.time.delayedCall(3000, () => {
        this.errorText?.setText('');
      });
    }
  }

  private cleanupInput() {
    if (this.nameInput && this.nameInput.parentNode) {
      this.nameInput.parentNode.removeChild(this.nameInput);
    }
  }

  shutdown() {
    this.cleanupInput();
    this.scale.off('resize', this.positionNameInput, this);
  }
}
