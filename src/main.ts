import Phaser from 'phaser'
import { GameScene } from './scenes/GameScene'

const width = 480
const height = 800

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width,
  height,
  backgroundColor: '#0e0f13',
  physics: {
    default: 'arcade',
    arcade: { gravity: { y: 0 }, debug: false }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width,
    height,
  },
  scene: [GameScene],
  input: { activePointers: 1 }
}

new Phaser.Game(config)