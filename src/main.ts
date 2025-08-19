import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'


const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  physics: {
    default: 'arcade',
    arcade: { gravity: { x: 0, y: 0 }, debug: true }
  },
  render: { pixelArt: false, antialias: true },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.NO_CENTER
  },
  scene: [GameScene],
  input: { activePointers: 1 }
}

new Phaser.Game(config)