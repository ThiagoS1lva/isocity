import Phaser from 'phaser'
import { GAME_CONFIG } from '../config/game.js'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }
  
  preload() {
    const { width, height } = this.scale
    
    const progressBox = this.add.graphics()
    const progressBar = this.add.graphics()
    
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRoundedRect(width / 2 - 160, height / 2 - 25, 320, 50, 10)
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Carregando...', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    const percentText = this.add.text(width / 2, height / 2, '0%', {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
    
    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0x8b5cf6, 1)
      progressBar.fillRoundedRect(width / 2 - 150, height / 2 - 15, 300 * value, 30, 8)
      percentText.setText(`${Math.round(value * 100)}%`)
    })
    
    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
      percentText.destroy()
    })
    
    this.load.spritesheet('tiles', '/01_130x66_130x230.png', {
      frameWidth: GAME_CONFIG.SPRITE_WIDTH,
      frameHeight: GAME_CONFIG.SPRITE_HEIGHT
    })
  }
  
  create() {
    this.scene.start('GameScene')
  }
}
