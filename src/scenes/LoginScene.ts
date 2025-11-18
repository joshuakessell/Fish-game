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

    // Background matching logo image - solid dark navy blue
    const graphics = this.add.graphics();
    graphics.fillStyle(0x0d1b2a, 1);
    graphics.fillRect(0, 0, 1800, 900);

    // Add subtle animated bubbles effect
    this.createBubbleParticles();

    // Ocean Attack Logo - centered and prominent
    const logo = this.add.image(900, 260, 'ocean-attack-logo');
    logo.setScale(0.55);
    logo.setOrigin(0.5);

    // Add subtle glow effect to logo
    this.tweens.add({
      targets: logo,
      alpha: 0.95,
      yoyo: true,
      duration: 2000,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Subtitle with modern styling - positioned below logo
    const subtitle = this.add.text(900, 530, 'Multiplayer Fishing Arena', {
      fontSize: '26px',
      color: '#87CEEB',
      fontStyle: 'bold',
      stroke: '#0d1b2a',
      strokeThickness: 3,
    });
    subtitle.setOrigin(0.5);

    // Name input label - positioned below subtitle
    const nameLabel = this.add.text(900, 600, 'Enter Your Name', {
      fontSize: '22px',
      color: '#FFD700',
      fontStyle: 'bold',
    });
    nameLabel.setOrigin(0.5);

    // Create HTML input field for name
    this.createNameInput();

    // Error message text (hidden initially)
    this.errorText = this.add.text(900, 700, '', {
      fontSize: '18px',
      color: '#FF6B6B',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.errorText.setOrigin(0.5);

    // Modern gradient button with glow - positioned below text input
    const buttonBg = this.add.graphics();
    buttonBg.fillGradientStyle(0xff6b35, 0xff6b35, 0xff8e53, 0xff8e53, 1);
    buttonBg.fillRoundedRect(750, 730, 300, 70, 35);
    buttonBg.lineStyle(3, 0xffd700, 1);
    buttonBg.strokeRoundedRect(750, 730, 300, 70, 35);

    const loginButton = this.add.zone(750, 730, 300, 70);
    loginButton.setOrigin(0, 0);
    loginButton.setInteractive({ useHandCursor: true });

    const loginText = this.add.text(900, 765, 'DIVE IN', {
      fontSize: '32px',
      color: '#FFF',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 4,
    });
    loginText.setOrigin(0.5);

    // Button hover effects with animation
    loginButton.on('pointerover', () => {
      buttonBg.clear();
      buttonBg.fillGradientStyle(0xff8e53, 0xff8e53, 0xffb380, 0xffb380, 1);
      buttonBg.fillRoundedRect(750, 730, 300, 70, 35);
      buttonBg.lineStyle(4, 0xffd700, 1);
      buttonBg.strokeRoundedRect(750, 730, 300, 70, 35);
      
      this.tweens.add({
        targets: loginText,
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
      });
    });

    loginButton.on('pointerout', () => {
      buttonBg.clear();
      buttonBg.fillGradientStyle(0xff6b35, 0xff6b35, 0xff8e53, 0xff8e53, 1);
      buttonBg.fillRoundedRect(750, 730, 300, 70, 35);
      buttonBg.lineStyle(3, 0xffd700, 1);
      buttonBg.strokeRoundedRect(750, 730, 300, 70, 35);
      
      this.tweens.add({
        targets: loginText,
        scaleX: 1,
        scaleY: 1,
        duration: 100,
      });
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

  private createBubbleParticles() {
    // Create particle emitter for bubbles
    const particles = this.add.particles(0, 900, 'fish-0-static', {
      speed: { min: 20, max: 60 },
      angle: { min: 260, max: 280 },
      scale: { start: 0.03, end: 0.08 },
      alpha: { start: 0.4, end: 0 },
      lifespan: 6000,
      frequency: 800,
      quantity: 1,
      emitting: true,
      x: { min: 0, max: 1800 },
      tint: 0x87ceeb,
    });
    particles.setDepth(-1);
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
      align-items: flex-start;
      justify-content: center;
      padding-top: 68%;
      z-index: 1000;
      pointer-events: none;
    `;

    // Create HTML input element with modern styling
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Enter your name...';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      font-size: 26px;
      padding: 14px 24px;
      width: 420px;
      max-width: 90vw;
      text-align: center;
      border: 3px solid #FFD700;
      border-radius: 12px;
      background: rgba(10, 25, 41, 0.85);
      color: #FFF;
      outline: none;
      font-family: Arial, sans-serif;
      pointer-events: auto;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      transition: all 0.3s ease;
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
