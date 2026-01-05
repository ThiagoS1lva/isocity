import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene.js'
import { GameScene } from './scenes/GameScene.js'
import { GAME_CONFIG } from './config/game.js'

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: GAME_CONFIG.COLORS.BACKGROUND,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, GameScene]
}

const game = new Phaser.Game(config)

window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight)
})
