import Phaser from 'phaser';
import { HQScene } from './scenes/HQScene';

const MAP_W = 640;
const MAP_H = 704;

function startGame() {
  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: MAP_W,
    height: MAP_H,
    backgroundColor: '#1a1a2e',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    input: {
      mouse: { preventDefaultWheel: false },
      touch: { capture: false },
    },
    scene: [HQScene],
  };

  const game = new Phaser.Game(config);
  (window as any).__PHASER_GAME__ = game;

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      game.destroy(true);
    });
  }
}

// Poll for auth — simple and reliable
function waitForAuth() {
  if ((window as any).__REX_AUTH) {
    startGame();
  } else {
    const check = setInterval(() => {
      if ((window as any).__REX_AUTH) {
        clearInterval(check);
        startGame();
      }
    }, 100);
  }
}

waitForAuth();
