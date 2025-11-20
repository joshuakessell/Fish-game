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

    // LEFT SIDE: Logo and subtitle (40% of screen)
    const logoX = 450; // Center of left half (0.25 * 1800)
    
    // Ocean Attack Logo - positioned on left side
    const logo = this.add.image(logoX, 350, 'ocean-attack-logo');
    logo.setScale(0.65);
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

    // Subtitle with modern styling - positioned below logo on left
    const subtitle = this.add.text(logoX, 650, 'Multiplayer Fishing Arena', {
      fontSize: '28px',
      color: '#87CEEB',
      fontStyle: 'bold',
      stroke: '#0d1b2a',
      strokeThickness: 3,
    });
    subtitle.setOrigin(0.5);

    // RIGHT SIDE: Login form (60% of screen)
    const formX = 1200; // Center of right section (0.67 * 1800)

    // Title on right side
    const welcomeText = this.add.text(formX, 280, 'WELCOME', {
      fontSize: '48px',
      color: '#FFD700',
      fontStyle: 'bold',
      stroke: '#0d1b2a',
      strokeThickness: 4,
    });
    welcomeText.setOrigin(0.5);

    // Instructions
    const instructionText = this.add.text(formX, 360, 'Enter your name to begin', {
      fontSize: '24px',
      color: '#87CEEB',
      fontStyle: 'normal',
    });
    instructionText.setOrigin(0.5);

    // Create HTML input field for name
    this.createNameInput();

    // Error message text (hidden initially) - positioned on right side
    this.errorText = this.add.text(formX, 620, '', {
      fontSize: '18px',
      color: '#FF6B6B',
      fontStyle: 'bold',
      stroke: '#000',
      strokeThickness: 3,
    });
    this.errorText.setOrigin(0.5);

    // Modern gradient button with glow - positioned on right side
    const buttonY = 680;
    const buttonBg = this.add.graphics();
    buttonBg.fillGradientStyle(0xff6b35, 0xff6b35, 0xff8e53, 0xff8e53, 1);
    buttonBg.fillRoundedRect(formX - 150, buttonY, 300, 70, 35);
    buttonBg.lineStyle(3, 0xffd700, 1);
    buttonBg.strokeRoundedRect(formX - 150, buttonY, 300, 70, 35);

    const loginButton = this.add.zone(formX - 150, buttonY, 300, 70);
    loginButton.setOrigin(0, 0);
    loginButton.setInteractive({ useHandCursor: true });

    const loginText = this.add.text(formX, buttonY + 35, 'DIVE IN', {
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
      buttonBg.fillRoundedRect(formX - 150, buttonY, 300, 70, 35);
      buttonBg.lineStyle(4, 0xffd700, 1);
      buttonBg.strokeRoundedRect(formX - 150, buttonY, 300, 70, 35);
      
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
      buttonBg.fillRoundedRect(formX - 150, buttonY, 300, 70, 35);
      buttonBg.lineStyle(3, 0xffd700, 1);
      buttonBg.strokeRoundedRect(formX - 150, buttonY, 300, 70, 35);
      
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
    console.log('LoginScene: Creating HTML input element with split-screen layout');
    
    // Create a fixed overlay container with split layout for iOS landscape compatibility
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

    // Container for the input positioned on the right side of screen
    const inputContainer = document.createElement('div');
    inputContainer.style.cssText = `
      position: absolute;
      left: 67%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 400px;
      max-width: 40vw;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    `;

    // Create HTML input element with modern styling
    this.nameInput = document.createElement('input');
    this.nameInput.type = 'text';
    this.nameInput.placeholder = 'Your name';
    this.nameInput.maxLength = 20;
    this.nameInput.style.cssText = `
      font-size: 24px;
      padding: 14px 24px;
      width: 100%;
      text-align: center;
      border: 3px solid #FFD700;
      border-radius: 12px;
      background: rgba(13, 27, 42, 0.95);
      color: #FFF;
      outline: none;
      font-family: Arial, sans-serif;
      pointer-events: auto;
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.3);
      transition: all 0.3s ease;
    `;

    // Focus styling
    this.nameInput.addEventListener('focus', () => {
      this.nameInput.style.borderColor = '#87CEEB';
      this.nameInput.style.boxShadow = '0 0 25px rgba(135, 206, 235, 0.5)';
    });

    this.nameInput.addEventListener('blur', () => {
      this.nameInput.style.borderColor = '#FFD700';
      this.nameInput.style.boxShadow = '0 0 20px rgba(255, 215, 0, 0.3)';
    });

    // Add input to container
    inputContainer.appendChild(this.nameInput);

    // Add container to overlay
    this.loginOverlay.appendChild(inputContainer);

    // Add overlay to DOM
    document.body.appendChild(this.loginOverlay);
    console.log('LoginScene: Login overlay created with split-screen layout for iOS landscape');

    // Handle mobile keyboard with visualViewport API
    if (window.visualViewport) {
      const handleViewportChange = () => {
        if (document.activeElement === this.nameInput && window.visualViewport) {
          // When keyboard is open on mobile, adjust positioning
          const viewportHeight = window.visualViewport.height;
          const offsetTop = window.visualViewport.offsetTop;
          
          // Adjust container position to stay visible with keyboard
          inputContainer.style.top = `${(viewportHeight / 2) + offsetTop}px`;
          inputContainer.style.transform = 'translate(-50%, -50%)';
        }
      };

      const handleBlur = () => {
        // Restore default positioning when keyboard closes
        inputContainer.style.top = '50%';
        inputContainer.style.transform = 'translate(-50%, -50%)';
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
