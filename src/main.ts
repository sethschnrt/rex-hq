import Phaser from 'phaser';
import { HQScene } from './scenes/HQScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#2d2d3f',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [HQScene],
};

const game = new Phaser.Game(config);

// HMR support
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
