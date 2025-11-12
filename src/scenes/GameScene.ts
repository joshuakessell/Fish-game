import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
  private fishSprites: Phaser.GameObjects.Sprite[] = [];
  private bulletSprites: Phaser.GameObjects.Sprite[] = [];
  
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    console.log('GameScene: Creating game world');
    
    // Ocean gradient background
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x001a33, 0x001a33, 0x004d7a, 0x004d7a, 1);
    graphics.fillRect(0, 0, 1800, 900);
    
    // Add decorative elements (bubbles, etc.)
    this.createAmbientBubbles();
    
    // TODO: Create turret sprites at cannon positions
    // TODO: Set up click handler for shooting
    // TODO: Connect to SignalR for real-time updates
    
    // Temporary: Draw turret positions
    this.drawTurretPositions();
    
    // Handle shooting
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleShoot(pointer.x, pointer.y);
    });
  }
  
  update(time: number, delta: number) {
    // TODO: Update fish positions using path computation
    // TODO: Update bullet positions
    // TODO: Handle collision detection
  }
  
  private createAmbientBubbles() {
    // Create some animated bubbles for atmosphere
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * 1800;
      const y = 900 + Math.random() * 100;
      
      const bubble = this.add.circle(x, y, 5, 0xffffff, 0.3);
      
      this.tweens.add({
        targets: bubble,
        y: -100,
        x: x + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 8000 + Math.random() * 4000,
        repeat: -1,
        delay: Math.random() * 5000,
      });
    }
  }
  
  private drawTurretPositions() {
    const positions = [
      { x: 0.12 * 1800, y: 90 },   // Top-left
      { x: 0.5 * 1800, y: 90 },    // Top-center
      { x: 0.88 * 1800, y: 90 },   // Top-right
      { x: 0.12 * 1800, y: 810 },  // Bottom-left
      { x: 0.5 * 1800, y: 810 },   // Bottom-center
      { x: 0.88 * 1800, y: 810 },  // Bottom-right
    ];
    
    positions.forEach((pos, idx) => {
      const turret = this.add.circle(pos.x, pos.y, 30, 0xffaa00, 0.5);
      const label = this.add.text(pos.x, pos.y, `P${idx}`, {
        fontSize: '20px',
        color: '#000',
      });
      label.setOrigin(0.5);
    });
  }
  
  private handleShoot(x: number, y: number) {
    console.log(`GameScene: Shooting at (${x}, ${y})`);
    
    // TODO: Send shoot event to server via SignalR
    // TODO: Create bullet sprite with trajectory
    
    // Temporary: Create a simple bullet visual
    const bullet = this.add.circle(900, 450, 8, 0xffff00);
    
    this.tweens.add({
      targets: bullet,
      x: x,
      y: y,
      duration: 1000,
      onComplete: () => {
        bullet.destroy();
      },
    });
  }
}
