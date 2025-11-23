import Phaser from "phaser";
import BootScene from "./scenes/BootScene";
import LoginScene from "./scenes/LoginScene";
import LobbyScene from "./scenes/LobbyScene";
import GameScene from "./scenes/GameScene";
import UIScene from "./scenes/UIScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1800,
  height: 900,
  parent: "game-container",
  backgroundColor: "#001f3f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, LoginScene, LobbyScene, GameScene, UIScene],
};

new Phaser.Game(config);
