import Phaser from 'phaser';

export default class LoginScene extends Phaser.Scene {
  private nameInput!: HTMLInputElement;
  private loginOverlay!: HTMLDivElement;
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
    console.log('LoginScene: Creating HTML input element with fixed overlay');
    
    // Create a fixed overlay container (independent from canvas positioning)
    this.loginOverlay = document.createElement('div');
    this.loginOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      pointer-events: none;
    `;

    // Create HTML input element
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Your Name';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      font-size: 28px;
      padding: 12px 20px;
      width: 400px;
      max-width: 90vw;
      text-align: center;
      border: 3px solid #FFD700;
      border-radius: 8px;
      background: rgba(0, 26, 51, 0.9);
      color: #FFF;
      outline: none;
      font-family: Arial, sans-serif;
      pointer-events: auto;
    `;

    // Add input to overlay
    this.loginOverlay.appendChild(this.nameInput);

    // Add overlay to DOM
    document.body.appendChild(this.loginOverlay);
    console.log('LoginScene: Login overlay created with centered flexbox layout');

    // Handle mobile keyboard with visualViewport API
    if (window.visualViewport) {
      const handleViewportChange = () => {
        if (document.activeElement === this.nameInput && window.visualViewport) {
          // When keyboard is open, offset the overlay to keep input visible
          const offsetTop = window.visualViewport.offsetTop;
          this.loginOverlay.style.top = `${offsetTop}px`;
          this.loginOverlay.style.height = `${window.visualViewport.height}px`;
        }
      };

      const handleBlur = () => {
        // Restore default positioning when keyboard closes
        this.loginOverlay.style.top = '0';
        this.loginOverlay.style.height = '100%';
      };

      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
      this.nameInput.addEventListener('blur', handleBlur);
      
      // Store for cleanup
      (this.nameInput as any)._viewportHandler = handleViewportChange;
      (this.nameInput as any)._blurHandler = handleBlur;
    }
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
    // Remove visualViewport listeners
    if (window.visualViewport && this.nameInput) {
      const viewportHandler = (this.nameInput as any)._viewportHandler;
      const blurHandler = (this.nameInput as any)._blurHandler;
      
      if (viewportHandler) {
        window.visualViewport.removeEventListener('resize', viewportHandler);
        window.visualViewport.removeEventListener('scroll', viewportHandler);
      }
      if (blurHandler) {
        this.nameInput.removeEventListener('blur', blurHandler);
      }
    }

    // Remove overlay from DOM
    if (this.loginOverlay && this.loginOverlay.parentNode) {
      this.loginOverlay.parentNode.removeChild(this.loginOverlay);
    }
  }

  shutdown() {
    this.cleanupInput();
  }
}
