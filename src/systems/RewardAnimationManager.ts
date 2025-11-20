import Phaser from 'phaser';
import { GameState } from './GameState';
import { FishSpriteManager } from './FishSpriteManager';
import { getPlayerBankPosition } from '../utils/PlayerSeatLayout';

interface RewardConfig {
  fontSize: string;
  coinCount: number;
  textScale: number;
  hasOutline: boolean;
  particleCount: number;
}

export class RewardAnimationManager {
  private scene: Phaser.Scene;
  private gameState: GameState;
  private fishSpriteManager: FishSpriteManager;
  private bankPositions: Map<number, { x: number; y: number }> = new Map();
  
  // Coin spawn configuration
  private readonly COIN_SPAWN_DELAY_MS = 50;
  private readonly COIN_TRAVEL_DURATION = 800;
  
  // Visual effects configuration
  private readonly BANK_FLASH_COLOR = 0xFFD700;
  private readonly BANK_FLASH_DURATION = 300;

  constructor(scene: Phaser.Scene, gameState: GameState, fishSpriteManager: FishSpriteManager) {
    this.scene = scene;
    this.gameState = gameState;
    this.fishSpriteManager = fishSpriteManager;

    for (let slot = 0; slot < 6; slot++) {
      this.bankPositions.set(slot, getPlayerBankPosition(slot));
    }
  }

  public setBankPosition(playerSlot: number, x: number, y: number): void {
    this.bankPositions.set(playerSlot, { x, y });
  }

  public playRewardAnimation(
    fishId: number,
    payout: number,
    playerSlot: number,
    isOwnKill: boolean,
  ): void {
    console.log(
      `🎬 [RewardAnimationManager] playRewardAnimation called: fishId=${fishId}, payout=${payout}, playerSlot=${playerSlot}, isOwnKill=${isOwnKill}`,
    );

    const fishSprite = this.fishSpriteManager.getFishSprites().get(fishId);
    if (!fishSprite) {
      console.warn(`   ⚠️ Cannot play reward animation: fish ${fishId} sprite not found`);
      return;
    }

    const fishPosition = { x: fishSprite.x, y: fishSprite.y };
    console.log(`   → Fish position: (${fishPosition.x}, ${fishPosition.y})`);

    const bankPosition = this.bankPositions.get(playerSlot);

    if (!bankPosition) {
      console.warn(
        `   ⚠️ Cannot play reward animation: bank position for slot ${playerSlot} not found`,
      );
      return;
    }

    console.log(
      `   → Bank position for slot ${playerSlot}: (${bankPosition.x}, ${bankPosition.y})`,
    );

    // Get player name for display
    const playerName = this.getPlayerNameBySlot(playerSlot);
    
    // Determine reward configuration based on payout value
    const rewardConfig = this.getRewardConfig(payout);
    
    console.log(`   → Creating floating text and ${rewardConfig.coinCount} coin animations`);

    // Create scaled floating text with player name
    this.createScaledFloatingText(fishPosition, payout, isOwnKill, playerName, rewardConfig);
    
    // Create multiple coins with staggered spawning
    this.createMultipleCoins(fishPosition, bankPosition, isOwnKill, rewardConfig.coinCount, playerSlot);
    
    // Create particle effect at fish position for large rewards
    if (payout >= 200) {
      this.createParticleExplosion(fishPosition, isOwnKill);
    }
  }

  private getPlayerNameBySlot(playerSlot: number): string | null {
    // Try to get player name from the players map in GameState
    const players = this.gameState.players;
    for (const [_, playerData] of players) {
      if (playerData.slot === playerSlot) {
        return playerData.name;
      }
    }
    return null;
  }

  private getRewardConfig(payout: number): RewardConfig {
    if (payout < 50) {
      // Small fish
      return {
        fontSize: '24px',
        coinCount: 1,
        textScale: 1.0,
        hasOutline: false,
        particleCount: 5,
      };
    } else if (payout < 200) {
      // Medium fish
      return {
        fontSize: '32px',
        coinCount: 3,
        textScale: 1.2,
        hasOutline: false,
        particleCount: 10,
      };
    } else if (payout < 1000) {
      // Large fish
      return {
        fontSize: '40px',
        coinCount: 5,
        textScale: 1.5,
        hasOutline: true,
        particleCount: 15,
      };
    } else {
      // Boss fish
      return {
        fontSize: '48px',
        coinCount: Math.min(10 + Math.floor(payout / 500), 20), // 10+ coins, max 20
        textScale: 2.0,
        hasOutline: true,
        particleCount: 25,
      };
    }
  }

  private createScaledFloatingText(
    position: { x: number; y: number },
    payout: number,
    isOwnKill: boolean,
    playerName: string | null,
    config: RewardConfig,
  ): void {
    // Determine colors based on if it's own kill
    const color = isOwnKill ? '#FFD700' : '#C0C0C0';
    const strokeColor = isOwnKill ? '#8B4513' : '#666666';
    
    // Build the display text
    let displayText = `+${payout}`;
    if (!isOwnKill && playerName) {
      displayText += `\n${playerName}`;
    }

    const text = this.scene.add.text(position.x, position.y, displayText, {
      fontSize: config.fontSize,
      color: color,
      fontStyle: 'bold',
      stroke: strokeColor,
      strokeThickness: config.hasOutline ? 6 : 4,
      align: 'center',
      shadow: config.hasOutline ? {
        offsetX: 2,
        offsetY: 2,
        color: '#000000',
        blur: 4,
        fill: true,
      } : undefined,
    });
    
    text.setOrigin(0.5, 0.5);
    text.setDepth(200);
    
    // Add scale pop-in animation for visual impact
    text.setScale(0.5);
    
    this.scene.tweens.add({
      targets: text,
      scale: config.textScale,
      duration: 200,
      ease: 'Back.easeOut',
      onComplete: () => {
        // After scale in, float up and fade
        this.scene.tweens.add({
          targets: text,
          y: position.y - 100,
          alpha: 0,
          duration: 1400,
          ease: 'Cubic.easeOut',
          onComplete: () => {
            text.destroy();
          },
        });
      },
    });
  }

  private createMultipleCoins(
    fishPosition: { x: number; y: number },
    bankPosition: { x: number; y: number },
    isOwnKill: boolean,
    coinCount: number,
    playerSlot: number,
  ): void {
    // Create coins with staggered spawning
    for (let i = 0; i < coinCount; i++) {
      this.scene.time.delayedCall(i * this.COIN_SPAWN_DELAY_MS, () => {
        this.createSingleCoinAnimation(
          fishPosition,
          bankPosition,
          isOwnKill,
          i,
          coinCount,
          playerSlot,
        );
      });
    }
  }

  private createSingleCoinAnimation(
    fishPosition: { x: number; y: number },
    bankPosition: { x: number; y: number },
    isOwnKill: boolean,
    coinIndex: number,
    totalCoins: number,
    playerSlot: number,
  ): void {
    const coinSize = isOwnKill ? 32 : 24;
    const coin = this.createCoinGraphic(coinSize, isOwnKill);
    
    // Add slight random offset to start position for variety
    const startX = fishPosition.x + (Math.random() - 0.5) * 30;
    const startY = fishPosition.y + (Math.random() - 0.5) * 30;
    coin.setPosition(startX, startY);
    coin.setDepth(200);
    
    // Calculate unique arc for each coin
    const angleOffset = (coinIndex / totalCoins) * Math.PI * 0.5 - Math.PI * 0.25;
    const arcHeight = 150 + Math.random() * 50;
    const midX = (startX + bankPosition.x) / 2 + Math.sin(angleOffset) * 100;
    const midY = Math.min(startY, bankPosition.y) - arcHeight;
    
    const path = new Phaser.Curves.QuadraticBezier(
      new Phaser.Math.Vector2(startX, startY),
      new Phaser.Math.Vector2(midX, midY),
      new Phaser.Math.Vector2(bankPosition.x, bankPosition.y),
    );
    
    let pathProgress = 0;
    
    // Add travel animation with spin
    this.scene.tweens.add({
      targets: { progress: 0 },
      progress: 1,
      duration: this.COIN_TRAVEL_DURATION + (coinIndex * 50), // Slightly different duration per coin
      ease: 'Cubic.easeInOut',
      onUpdate: (tween) => {
        const value = tween.getValue();
        pathProgress = value !== null ? value : 0;
        const point = path.getPoint(pathProgress);
        coin.setPosition(point.x, point.y);
        // Spin animation
        coin.setRotation(pathProgress * Math.PI * 8 + coinIndex * Math.PI * 0.5);
        // Scale down as it approaches the bank
        const scale = 1 - (pathProgress * 0.3);
        coin.setScale(scale);
      },
      onComplete: () => {
        // Create particle effect when coin reaches bank
        this.createCoinArrivalEffect(bankPosition, isOwnKill);
        
        // Flash the bank display for own kills
        if (isOwnKill && coinIndex === 0) { // Only flash once per reward
          this.flashBankDisplay(playerSlot);
        }
        
        coin.destroy();
      },
    });
    
    // Play coin sound effect if available
    // Note: Sound implementation would go here if sound assets are available
  }

  private createCoinGraphic(size: number, isGolden: boolean): Phaser.GameObjects.Graphics {
    const coin = this.scene.add.graphics();

    if (isGolden) {
      // Gold coin for own kills
      coin.fillStyle(0xffd700, 1);
      coin.fillCircle(0, 0, size / 2);
      // Shiny highlight
      coin.fillStyle(0xffed4e, 1);
      coin.fillCircle(-size / 8, -size / 8, size / 4);
      // Border
      coin.lineStyle(2, 0xdaa520, 1);
      coin.strokeCircle(0, 0, size / 2);
      // Add center symbol
      coin.lineStyle(2, 0xdaa520, 1);
      coin.strokeCircle(0, 0, size / 5);
    } else {
      // Silver coin for other players' kills
      coin.fillStyle(0xc0c0c0, 1);
      coin.fillCircle(0, 0, size / 2);
      // Shiny highlight
      coin.fillStyle(0xe0e0e0, 1);
      coin.fillCircle(-size / 8, -size / 8, size / 4);
      // Border
      coin.lineStyle(2, 0xa0a0a0, 1);
      coin.strokeCircle(0, 0, size / 2);
      // Add center symbol
      coin.lineStyle(2, 0xa0a0a0, 1);
      coin.strokeCircle(0, 0, size / 5);
    }

    return coin;
  }

  private createParticleExplosion(position: { x: number; y: number }, isGolden: boolean): void {
    const particleCount = 12;
    const color = isGolden ? 0xffd700 : 0xc0c0c0;
    
    for (let i = 0; i < particleCount; i++) {
      const particle = this.scene.add.graphics();
      particle.fillStyle(color, 1);
      particle.fillCircle(0, 0, 3);
      particle.setPosition(position.x, position.y);
      particle.setDepth(199);
      
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = 100 + Math.random() * 50;
      const targetX = position.x + Math.cos(angle) * speed;
      const targetY = position.y + Math.sin(angle) * speed;
      
      this.scene.tweens.add({
        targets: particle,
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 600,
        ease: 'Power2',
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private createCoinArrivalEffect(position: { x: number; y: number }, isGolden: boolean): void {
    const sparkleCount = 6;
    const color = isGolden ? 0xffd700 : 0xc0c0c0;
    
    for (let i = 0; i < sparkleCount; i++) {
      const sparkle = this.scene.add.graphics();
      sparkle.fillStyle(color, 1);
      // Draw a simple diamond shape as sparkle
      sparkle.beginPath();
      sparkle.moveTo(0, -4);
      sparkle.lineTo(2, 0);
      sparkle.lineTo(0, 4);
      sparkle.lineTo(-2, 0);
      sparkle.closePath();
      sparkle.fill();
      sparkle.setPosition(position.x, position.y);
      sparkle.setDepth(201);
      sparkle.setScale(0);
      
      this.scene.tweens.add({
        targets: sparkle,
        scale: 1.5,
        alpha: 0,
        duration: 400,
        delay: i * 30,
        ease: 'Back.easeOut',
        onComplete: () => {
          sparkle.destroy();
        },
      });
    }
  }

  private flashBankDisplay(playerSlot: number): void {
    // Only flash if it's the local player's slot
    if (playerSlot !== this.gameState.myPlayerSlot) {
      return;
    }
    
    const bankPosition = this.bankPositions.get(playerSlot);
    if (!bankPosition) {
      return;
    }
    
    // Create a flash effect at bank position
    const flashGraphic = this.scene.add.graphics();
    flashGraphic.fillStyle(this.BANK_FLASH_COLOR, 0.5);
    flashGraphic.fillRoundedRect(
      bankPosition.x - 75,
      bankPosition.y - 20,
      150,
      40,
      5,
    );
    flashGraphic.setDepth(89); // Just below UI
    
    this.scene.tweens.add({
      targets: flashGraphic,
      alpha: 0,
      duration: this.BANK_FLASH_DURATION,
      ease: 'Power2',
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        flashGraphic.destroy();
      },
    });
  }
}