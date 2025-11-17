import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import LoginScene from './scenes/LoginScene';
import LobbyScene from './scenes/LobbyScene';
import GameScene from './scenes/GameScene';
import UIScene from './scenes/UIScene';
import { MobileEntryManager } from './MobileEntryManager';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1800,
  height: 900,
  parent: 'game-container',
  backgroundColor: '#001f3f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, LoginScene, LobbyScene, GameScene, UIScene],
};

// Initialize the mobile entry manager
const gameContainer = document.getElementById('game-container');
if (gameContainer) {
  // For testing: Enable test mode if URL contains testMobile in hash
  if (window.location.hash.includes('testMobile')) {
    (window as any).testMobile = true;
  }
  
  const mobileEntryManager = new MobileEntryManager(gameContainer);
  
  // Set the callback for when the game should start
  mobileEntryManager.onGameStart(() => {
    console.log('MobileEntryManager: Starting Phaser game');
    new Phaser.Game(config);
  });
  
  // Now initialize the manager - this will check orientation and start the flow
  // This must be called AFTER setting the callback
  mobileEntryManager.initialize();
}
