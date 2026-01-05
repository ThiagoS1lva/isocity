import Phaser from 'phaser'
import { GAME_CONFIG } from '../config/game.js'
import { CityManager } from '../systems/CityManager.js'
import { getBuilding, getBuildingsByCategory, BUILDING_TYPES, CATEGORY_INFO } from '../config/buildings.js'
import { IconFactory } from '../systems/IconFactory.js'

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' })
    this.cityManager = null
    this.selectedTile = { row: 0, col: 0 }
    this.tileSprites = []
    this.connectionIndicators = []
    this.highlightGraphics = null
    this.isPlacing = false
    this.gameTimer = null
    this.iconFactory = null
    this.currentCategory = BUILDING_TYPES.ROAD
    this.categoryButtons = {}
    this.buildingSprites = []
    
    this.cameraZoom = 1
    this.minZoom = 0.5
    this.maxZoom = 2
    this.isDragging = false
    this.dragStart = { x: 0, y: 0 }
    this.mapOffset = { x: 0, y: 0 }
    this.mapOffset = { x: 0, y: 0 }
    this.keys = null
    this.currentRotation = 0 // 0: Normal, 1: FlipX
  }
  
  create() {
    this.cityManager = new CityManager()
    this.iconFactory = new IconFactory(this)
    
    this.cameras.main.setBackgroundColor(GAME_CONFIG.COLORS.BACKGROUND)
    this.input.mouse.disableContextMenu()
    
    this.keys = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      arrowUp: Phaser.Input.Keyboard.KeyCodes.UP,
      arrowDown: Phaser.Input.Keyboard.KeyCodes.DOWN,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      arrowLeft: Phaser.Input.Keyboard.KeyCodes.LEFT,
      arrowRight: Phaser.Input.Keyboard.KeyCodes.RIGHT,
      reset: Phaser.Input.Keyboard.KeyCodes.BACKSPACE,
      rotate: Phaser.Input.Keyboard.KeyCodes.R,
      space: Phaser.Input.Keyboard.KeyCodes.SPACE
    })
    
    this.createMap()
    this.createHUD()
    this.createBottomToolbar()
    this.setupInput()
    this.setupCameraControls()
    this.startGameLoop()
    
    this.cityManager.addListener((stats) => this.updateHUD(stats))
    this.updateHUD(this.cityManager.getStats())
    
    this.loadStateFromURL()
  }
  
  update() {
    this.handleKeyboardCamera()
    
    if (Phaser.Input.Keyboard.JustDown(this.keys.rotate)) {
      this.currentRotation = this.currentRotation === 0 ? 1 : 0
      this.showNotification(`Rotação: ${this.currentRotation === 0 ? 'Normal' : 'Invertida'}`, 'info')
    }
  }
  
  createMap() {
    const { MAP_SIZE, TILE_WIDTH, TILE_HEIGHT, SPRITE_WIDTH, SPRITE_HEIGHT } = GAME_CONFIG
    
    const mapY = (this.scale.height - 200) / 2 + 30
    this.mapContainer = this.add.container(this.scale.width / 2, mapY)
    this.mapContainer.setDepth(5)
    
    this.highlightGraphics = this.add.graphics()
    this.mapContainer.add(this.highlightGraphics)
    
    this.tileSprites = []
    this.groundSprites = [] // Nova camada de chão
    this.connectionIndicators = []
    
    for (let i = 0; i < MAP_SIZE; i++) {
      this.tileSprites[i] = []
      this.groundSprites[i] = []
      this.connectionIndicators[i] = []
      for (let j = 0; j < MAP_SIZE; j++) {
        const { x, y } = this.isoToScreen(i, j)
        
        // Sprite de Chão (Base)
        const ground = this.add.sprite(x, y - SPRITE_HEIGHT / 2 + TILE_HEIGHT + 35, 'tiles', 0)
        ground.setOrigin(0.5, 0.5)
        ground.setData('gridX', i)
        ground.setData('gridY', j)
        ground.setData('layer', 0) // Layer 0 = Chão
        this.mapContainer.add(ground)
        this.groundSprites[i][j] = ground
        
        // Sprite do Prédio/Estrutura
        const sprite = this.add.sprite(x, y - SPRITE_HEIGHT / 2 + TILE_HEIGHT + 35, 'tiles', 0)
        sprite.setOrigin(0.5, 0.5)
        sprite.setInteractive()
        sprite.setData('gridX', i)
        sprite.setData('gridY', j)
        sprite.setData('layer', 1) // Layer 1 = Estrutura
        
        this.mapContainer.add(sprite)
        this.tileSprites[i][j] = sprite
        
        const indicator = this.add.graphics()
        indicator.setVisible(false)
        indicator.setData('gridX', i)
        indicator.setData('gridY', j)
        indicator.setData('isIndicator', true)
        this.mapContainer.add(indicator)
        this.connectionIndicators[i][j] = indicator
      }
    }
    
    this.sortMapSprites()
    
    // Adicionar Indicadores de Direção (Debug Visual)
    const centerTile = this.isoToScreen(0, 0)
    const leftTile = this.isoToScreen(MAP_SIZE - 1, 0)
    const rightTile = this.isoToScreen(0, MAP_SIZE - 1)
    const bottomTile = this.isoToScreen(MAP_SIZE - 1, MAP_SIZE - 1)
    
    const style = { font: 'bold 16px Arial', color: '#fbbf24', backgroundColor: '#00000088', padding: { x: 4, y: 4 } }
    
    // Topo (Entre NE e NW)
    this.mapContainer.add(this.add.text(centerTile.x, centerTile.y - 120, 'NORTE (Top)', style).setOrigin(0.5))
    
    // Esquerda (Entre NW e SW) - Onde X aumenta (SW) e Y diminui? Não.
    // Lado Esquerdo do losango é definido por X variando (0 a 10) e Y=0
    // Isso é a direção SW (x aumenta)
    this.mapContainer.add(this.add.text(leftTile.x - 60, leftTile.y, 'OESTE\n(SW - x+)', style).setOrigin(1, 0.5))
    
    // Direita (Entre NE e SE) - Lado onde Y varia (0 a 10) e X=0
    // Isso é a direção SE (y aumenta)
    this.mapContainer.add(this.add.text(rightTile.x + 60, rightTile.y, 'LESTE\n(SE - y+)', style).setOrigin(0, 0.5))
    
    // Baixo
    this.mapContainer.add(this.add.text(bottomTile.x, bottomTile.y + 100, 'SUL (Bottom)', style).setOrigin(0.5))
    
    // Indicadores dos Eixos (NW/NE)
    // NW: Direção onde Y diminui. Fica "atrás" da esquerda.
    this.mapContainer.add(this.add.text(centerTile.x - 100, centerTile.y - 50, 'NW (y-)', { ...style, color: '#94a3b8' }).setOrigin(0.5))
    
    // NE: Direção onde X diminui. Fica "atrás" da direita.
    this.mapContainer.add(this.add.text(centerTile.x + 100, centerTile.y - 50, 'NE (x-)', { ...style, color: '#94a3b8' }).setOrigin(0.5))

  }
  
  isoToScreen(gridX, gridY) {
    const { TILE_WIDTH, TILE_HEIGHT } = GAME_CONFIG
    return {
      x: (gridY - gridX) * (TILE_WIDTH / 2),
      y: (gridX + gridY) * (TILE_HEIGHT / 2)
    }
  }
  
  sortMapSprites() {
    this.mapContainer.list.sort((a, b) => {
      if (a === this.highlightGraphics) return 1
      if (b === this.highlightGraphics) return -1
      
      const aX = a.getData ? (a.getData('gridX') || 0) : 0
      const aY = a.getData ? (a.getData('gridY') || 0) : 0
      const bX = b.getData ? (b.getData('gridX') || 0) : 0
      const bY = b.getData ? (b.getData('gridY') || 0) : 0
      
      const diff = (aX + aY) - (bX + bY)
      if (diff !== 0) return diff
      
      // Mesma posição: Ordenar por layer
      // Layer 0 (Chão) < Layer 1 (Estrutura) < Indicator
      const aLayer = a.getData ? (a.getData('layer') || 0) : 0
      const bLayer = b.getData ? (b.getData('layer') || 0) : 0
      
      if (aLayer !== bLayer) return aLayer - bLayer
      
      // Se estiverem na mesma posição e layer (ex: indicator vs estrutura se não definido layer no indicator)
      if (a.getData && a.getData('isIndicator')) return 1
      if (b.getData && b.getData('isIndicator')) return -1
      
      return 0
    })
  }
  
  createHUD() {
    const width = this.scale.width
    
    this.hudBg = this.add.graphics()
    this.hudBg.fillStyle(0x111827, 0.95)
    this.hudBg.fillRect(0, 0, width, 50)
    this.hudBg.setDepth(20)
    
    const hudStyle = { font: 'bold 14px Arial', color: '#ffffff' }
    const hudY = 25
    const items = [
      { key: 'money', icon: 'money', color: 0xfbbf24, x: 80 },
      { key: 'income', icon: 'income', color: 0x4ade80, x: 200 },
      { key: 'population', icon: 'population', color: 0x60a5fa, x: 320 },
      { key: 'happiness', icon: 'happiness', color: 0xf472b6, x: 420 },
      { key: 'pollution', icon: 'pollution', color: 0x9ca3af, x: 520 },
      { key: 'roads', icon: 'road', color: 0xffffff, x: 620 }
    ]
    
    this.hudElements = {}
    
    items.forEach(item => {
      const icon = this.iconFactory.createIcon(item.icon, item.x - 25, hudY, 18, item.color)
      icon.setDepth(21)
      
      const text = this.add.text(item.x, hudY, '0', hudStyle).setOrigin(0, 0.5).setDepth(21)
      this.hudElements[item.key] = text
    })
    
    this.createSpeedControls()
  }
  
  createSpeedControls() {
    const startX = this.scale.width - 140
    const y = 25
    
    this.pauseBtn = this.add.text(startX, y, '⏸', {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: '#374151',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21)
    
    this.pauseBtn.on('pointerdown', () => {
      this.cityManager.togglePause()
      this.updateSpeedButtons()
    })
    
    this.speed1Btn = this.createSpeedButton(startX + 40, y, '1x', () => this.setSpeed(1), true)
    this.speed2Btn = this.createSpeedButton(startX + 75, y, '2x', () => this.setSpeed(2), false)
    this.speed3Btn = this.createSpeedButton(startX + 110, y, '3x', () => this.setSpeed(3), false)
  }
  
  createSpeedButton(x, y, text, callback, active) {
    const bg = active ? '#8b5cf6' : '#374151'
    const btn = this.add.text(x, y, text, {
      font: 'bold 12px Arial',
      color: '#ffffff',
      backgroundColor: bg,
      padding: { x: 6, y: 4 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21)
    
    btn.on('pointerdown', callback)
    
    return btn
  }
  
  setSpeed(speed) {
    this.cityManager.setSpeed(speed)
    this.restartGameLoop()
    this.updateSpeedButtons()
  }
  
  updateSpeedButtons() {
    const { isPaused, gameSpeed } = this.cityManager.getStats()
    
    this.pauseBtn.setText(isPaused ? '▶' : '⏸')
    this.pauseBtn.setStyle({ backgroundColor: isPaused ? '#22c55e' : '#374151' })
    
    this.speed1Btn.setStyle({ backgroundColor: gameSpeed === 1 && !isPaused ? '#8b5cf6' : '#374151' })
    this.speed2Btn.setStyle({ backgroundColor: gameSpeed === 2 && !isPaused ? '#8b5cf6' : '#374151' })
    this.speed3Btn.setStyle({ backgroundColor: gameSpeed === 3 && !isPaused ? '#8b5cf6' : '#374151' })
  }
  
  createBottomToolbar() {
    const width = this.scale.width
    const height = this.scale.height
    const toolbarHeight = 180
    const toolbarY = height - toolbarHeight
    
    this.toolbarBg = this.add.graphics()
    this.toolbarBg.fillStyle(0x111827, 0.95)
    this.toolbarBg.fillRect(0, toolbarY, width, toolbarHeight)
    this.toolbarBg.lineStyle(2, 0x374151)
    this.toolbarBg.lineBetween(0, toolbarY, width, toolbarY)
    this.toolbarBg.setDepth(15)
    
    this.createCategoryTabs(toolbarY)
    this.createBuildingPanel(toolbarY + 45)
    
    this.selectCategory(BUILDING_TYPES.ROAD)
  }
  
  createCategoryTabs(toolbarY) {
    const categories = [
      BUILDING_TYPES.ROAD,
      BUILDING_TYPES.RESIDENTIAL,
      BUILDING_TYPES.COMMERCIAL,
      BUILDING_TYPES.INDUSTRIAL,
      BUILDING_TYPES.SERVICE,
      BUILDING_TYPES.DECORATION,
      BUILDING_TYPES.NATURE
    ]
    
    const tabWidth = 110
    const startX = 20
    
    this.categoryButtons = {}
    
    categories.forEach((cat, index) => {
      const info = CATEGORY_INFO[cat]
      const x = startX + index * (tabWidth + 5)
      
      const btn = this.add.text(x, toolbarY + 8, info.name, {
        font: 'bold 12px Arial',
        color: '#ffffff',
        backgroundColor: '#374151',
        padding: { x: 12, y: 8 }
      }).setInteractive({ useHandCursor: true }).setDepth(16)
      
      btn.on('pointerdown', () => this.selectCategory(cat))
      btn.on('pointerover', () => {
        if (this.currentCategory !== cat) {
          btn.setAlpha(0.8)
        }
      })
      btn.on('pointerout', () => btn.setAlpha(1))
      
      this.categoryButtons[cat] = { btn, info }
    })
  }
  
  selectCategory(category) {
    if (this.currentCategory !== category) {
      this.buildingScrollX = 0
    }
    this.currentCategory = category
    
    for (const [cat, data] of Object.entries(this.categoryButtons)) {
      const isSelected = cat === category
      const color = isSelected ? `#${data.info.color.toString(16).padStart(6, '0')}` : '#374151'
      data.btn.setStyle({ backgroundColor: color })
    }
    
    this.updateBuildingPanel()
  }
  
  createBuildingPanel(panelY) {
    this.buildingContainer = this.add.container(0, 0)
    this.buildingContainer.setDepth(16)
    
    // Máscara para o painel de edifícios
    const maskShape = this.make.graphics()
    maskShape.fillStyle(0xffffff)
    maskShape.fillRect(0, panelY, this.scale.width, this.scale.height - panelY)
    const mask = maskShape.createGeometryMask()
    this.buildingContainer.setMask(mask)
    
    this.buildingPanelY = panelY
    this.buildingScrollX = 0
    this.contentWidth = 0
  }
  
  updateBuildingPanel() {
    this.buildingContainer.removeAll(true)
    this.buildingSprites = []
    
    const buildings = getBuildingsByCategory(this.currentCategory)
    const { TEXTURE_COLS, SPRITE_WIDTH, SPRITE_HEIGHT } = GAME_CONFIG
    
    const scale = 0.5
    const spacing = SPRITE_WIDTH * scale + 10
    const startX = 60 // Margem inicial
    const y = this.buildingPanelY + 55
    
    // Calcular largura total para limites de scroll
    this.contentWidth = startX + buildings.length * spacing + 100
    
    // Resetar scroll ao mudar de categoria
    // this.buildingScrollX = 0 // (Opcional, mas bom para UX)
    // Atualizar posição do container
    this.buildingContainer.x = this.buildingScrollX
    
    buildings.forEach((building, index) => {
      const x = startX + index * spacing
      const row = Math.floor(building.index / TEXTURE_COLS)
      const col = building.index % TEXTURE_COLS
      
      let sprite
      if (building.texture) {
        sprite = this.add.sprite(x, y, building.texture)
        // Ajuste de escala específico se necessário, ou usar padrão
        const scaleAdjust = 130 / sprite.width // Tentar manter largura consistente
        sprite.setScale(scale * scaleAdjust)
      } else {
        // Se for Estrada Inteligente (100), mostrar frame 7 (Cruzamento) como ícone
        const frameIndex = building.index === 100 ? 7 : building.index
        sprite = this.add.sprite(x, y, 'tiles', frameIndex)
        sprite.setScale(scale)
      }
      
      sprite.setOrigin(0.5, 0.5)
      sprite.setInteractive({ useHandCursor: true })
      sprite.setData('buildingIndex', building.index)
      sprite.setData('row', row)
      sprite.setData('col', col)
      sprite.setData('baseX', x)
      
      const costText = this.add.text(x, y + SPRITE_HEIGHT * scale / 2 + 15, `$${building.cost}`, {
        font: 'bold 11px Arial',
        color: '#9ca3af'
      }).setOrigin(0.5).setDepth(16)
      
      sprite.on('pointerover', () => {
        sprite.setTint(0xcccccc)
        this.showBuildingTooltip(sprite, building, x, y - SPRITE_HEIGHT * scale / 2 - 20)
      })
      
      sprite.on('pointerout', () => {
        if (this.selectedTile.row !== row || this.selectedTile.col !== col) {
          sprite.clearTint()
        }
        this.hideTooltip()
      })
      
      sprite.on('pointerdown', () => {
        this.selectedTile = { row, col }
        this.updateBuildingSelection(building.index)
      })
      
      this.buildingContainer.add(sprite)
      this.buildingContainer.add(costText)
      this.buildingSprites.push({ sprite, costText, index: building.index })
    })
    
    this.selectedIndicator = this.add.graphics()
    this.selectedIndicator.setDepth(17)
    this.buildingContainer.add(this.selectedIndicator)
    
    if (buildings.length > 0) {
      const first = buildings[0]
      const row = Math.floor(first.index / TEXTURE_COLS)
      const col = first.index % TEXTURE_COLS
      this.selectedTile = { row, col }
      this.updateBuildingSelection(first.index)
    }
  }
  
  updateBuildingSelection(buildingIndex) {
    this.selectedIndicator.clear()
    
    this.buildingSprites.forEach(item => {
      if (item.index === buildingIndex) {
        item.sprite.setTint(0xaaaaff)
        this.selectedIndicator.lineStyle(3, CATEGORY_INFO[this.currentCategory].color)
        this.selectedIndicator.strokeRoundedRect(
          item.sprite.x - item.sprite.displayWidth / 2 - 5,
          item.sprite.y - item.sprite.displayHeight / 2 - 5,
          item.sprite.displayWidth + 10,
          item.sprite.displayHeight + 10,
          8
        )
      } else {
        item.sprite.clearTint()
      }
    })
  }
  
  showBuildingTooltip(sprite, building, x, y) {
    if (this.tooltip) this.tooltip.destroy()
    
    let text = `${building.name}`
    if (building.income > 0) text += ` | +$${building.income}/s`
    if (building.income < 0) text += ` | -$${Math.abs(building.income)}/s`
    if (building.population) text += ` | +${building.population} pop`
    if (building.happiness) text += ` | +${building.happiness} felicidade`
    if (building.pollution > 0) text += ` | +${building.pollution} poluição`
    if (building.pollution < 0) text += ` | ${building.pollution} poluição`
    
    this.tooltip = this.add.text(x, y, text, {
      font: '12px Arial',
      color: '#ffffff',
      backgroundColor: '#1f2937',
      padding: { x: 10, y: 6 }
    }).setOrigin(0.5, 1).setDepth(100)
  }
  
  hideTooltip() {
    if (this.tooltip) {
      this.tooltip.destroy()
      this.tooltip = null
    }
  }
  
  setupInput() {
    const toolbarY = this.scale.height - 180
    
    this.input.on('pointerdown', (pointer) => {
      if (pointer.middleButtonDown() || (pointer.leftButtonDown() && this.keys.space.isDown)) {
        this.isDragging = true
        this.dragStart.x = pointer.x
        this.dragStart.y = pointer.y
        return
      }
      
      if (pointer.y < toolbarY && pointer.y > 50 && !this.isDragging) {
        this.isPlacing = true
        this.handleTileClick(pointer)
      }
    })
    
    this.input.on('pointermove', (pointer) => {
      if (this.isDragging) {
        const dx = pointer.x - this.dragStart.x
        const dy = pointer.y - this.dragStart.y
        this.mapContainer.x += dx
        this.mapContainer.y += dy
        this.dragStart.x = pointer.x
        this.dragStart.y = pointer.y
        return
      }
      
      if (pointer.y < toolbarY && pointer.y > 50) {
        this.updateHighlight(pointer)
        if (this.isPlacing && pointer.isDown) {
          this.handleTileClick(pointer)
        }
      } else {
        this.highlightGraphics.clear()
      }
    })
    
    this.input.on('pointerup', () => {
      this.isPlacing = false
      this.isDragging = false
    })
  }
  
  setupCameraControls() {
    const toolbarY = this.scale.height - 180
    
    this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY) => {
      if (pointer.y > toolbarY) {
        // Scroll da Toolbar
        const scrollSpeed = 0.5
        this.buildingScrollX -= deltaY * scrollSpeed
        
        // Limitar scroll
        const minScroll = Math.min(0, this.scale.width - this.contentWidth)
        this.buildingScrollX = Phaser.Math.Clamp(this.buildingScrollX, minScroll, 0)
        
        this.buildingContainer.x = this.buildingScrollX
      } else if (pointer.y > 50) {
        // Zoom do Mapa
        const zoomDelta = deltaY > 0 ? -0.1 : 0.1
        this.cameraZoom = Phaser.Math.Clamp(this.cameraZoom + zoomDelta, this.minZoom, this.maxZoom)
        
        this.mapContainer.setScale(this.cameraZoom)
      }
    })
    
    this.zoomInfoText = this.add.text(this.scale.width - 80, 60, 'Zoom: 100%', {
      font: '12px Arial',
      color: '#9ca3af'
    }).setDepth(21)
    
    this.controlsHint = this.add.text(10, this.scale.height - 195, 'WASD/Setas: Mover | Scroll: Zoom | Arraste Meio: Pan | R: Reset', {
      font: '11px Arial',
      color: '#6b7280'
    }).setDepth(21)
  }
  
  handleKeyboardCamera() {
    const speed = 8 / this.cameraZoom
    
    if (this.keys.up.isDown || this.keys.arrowUp.isDown) {
      this.mapContainer.y += speed
    }
    if (this.keys.down.isDown || this.keys.arrowDown.isDown) {
      this.mapContainer.y -= speed
    }
    if (this.keys.left.isDown || this.keys.arrowLeft.isDown) {
      this.mapContainer.x += speed
    }
    if (this.keys.right.isDown || this.keys.arrowRight.isDown) {
      this.mapContainer.x -= speed
    }
    
    if (this.keys.reset.isDown) {
      this.resetCamera()
    }
    
    this.zoomInfoText.setText(`Zoom: ${Math.round(this.cameraZoom * 100)}%`)
  }
  
  resetCamera() {
    const mapY = (this.scale.height - 200) / 2 + 30
    this.mapContainer.x = this.scale.width / 2
    this.mapContainer.y = mapY
    this.cameraZoom = 1
    this.mapContainer.setScale(1)
  }
  
  screenToIso(screenX, screenY) {
    const { TILE_WIDTH, TILE_HEIGHT } = GAME_CONFIG
    
    const localX = (screenX - this.mapContainer.x) / this.cameraZoom
    const localY = (screenY - this.mapContainer.y) / this.cameraZoom
    
    const isoX = (localY / TILE_HEIGHT - localX / TILE_WIDTH)
    const isoY = (localY / TILE_HEIGHT + localX / TILE_WIDTH)
    
    return {
      x: Math.floor(isoX),
      y: Math.floor(isoY)
    }
  }
  
  updateHighlight(pointer) {
    const { TILE_WIDTH, TILE_HEIGHT, MAP_SIZE } = GAME_CONFIG
    const pos = this.screenToIso(pointer.x, pointer.y)
    
    this.highlightGraphics.clear()
    
    if (pos.x >= 0 && pos.x < MAP_SIZE && pos.y >= 0 && pos.y < MAP_SIZE) {
      const screen = this.isoToScreen(pos.x, pos.y)
      const buildingIndex = this.selectedTile.row * GAME_CONFIG.TEXTURE_COLS + this.selectedTile.col
      const canAfford = this.cityManager.canAfford(buildingIndex)
      
      const color = canAfford ? GAME_CONFIG.COLORS.HIGHLIGHT_OK : GAME_CONFIG.COLORS.HIGHLIGHT_NO
      
      this.highlightGraphics.fillStyle(color, 0.3)
      this.highlightGraphics.beginPath()
      this.highlightGraphics.moveTo(screen.x, screen.y)
      this.highlightGraphics.lineTo(screen.x + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2)
      this.highlightGraphics.lineTo(screen.x, screen.y + TILE_HEIGHT)
      this.highlightGraphics.lineTo(screen.x - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2)
      this.highlightGraphics.closePath()
      this.highlightGraphics.fillPath()
    }
  }
  
  handleTileClick(pointer) {
    const { MAP_SIZE } = GAME_CONFIG
    const pos = this.screenToIso(pointer.x, pointer.y)
    
    if (pos.x >= 0 && pos.x < MAP_SIZE && pos.y >= 0 && pos.y < MAP_SIZE) {
      const isRightClick = pointer.rightButtonDown()
      
      if (isRightClick) {
        this.cityManager.clearTile(pos.x, pos.y)
      } else {
        const result = this.cityManager.setTile(pos.x, pos.y, this.selectedTile.row, this.selectedTile.col, this.currentRotation)
        if (!result.success && result.reason === 'no_money') {
          this.showNotification('Dinheiro insuficiente!', 'error')
        }
      }
      
      this.updateMapDisplay()
      this.updateConnectionIndicators()
      this.saveStateToURL()
    }
  }
  
  updateMapDisplay() {
    const { MAP_SIZE, TEXTURE_COLS, TILE_HEIGHT, SPRITE_HEIGHT } = GAME_CONFIG
    
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const tile = this.cityManager.getTile(i, j)
        const frameIndex = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(frameIndex)
        
        const sprite = this.tileSprites[i][j]
        const ground = this.groundSprites[i][j]
        const { x, y } = this.isoToScreen(i, j)
        
        // Aplicar rotação
        const rotation = tile.rotation || 0
        sprite.setFlipX(rotation === 1)
        
        if (building.texture) {
          // --- MODO CUSTOM TEXTURE (ex: Bombeiro) ---
          
          // 1. Mostrar Chão (Grama/Base)
          ground.setVisible(true)
          ground.setFrame(0) // 0 = Grama padrão
          
          // 2. Configurar Sprite do Prédio
          sprite.setTexture(building.texture)
          
          // Redimensionar para caber na largura do tile (com margem)
          // TILE_WIDTH é 128. Vamos usar 120px como alvo seguro de largura base
          const targetWidth = GAME_CONFIG.TILE_WIDTH
          const scale = targetWidth / sprite.width
          sprite.setScale(scale)
          
          // Posicionamento: Base da imagem no vértice inferior do losango
          sprite.setOrigin(0.5, 1) // Base inferior
          // Vértice inferior do losango é em Y + TILE_HEIGHT
          sprite.y = y + TILE_HEIGHT
          sprite.x = x // Centro X
          
        } else {
          // --- MODO SPRITESHEET PADRÃO ---
          
          // 1. Esconder Chão separado (o sprite padrão já tem chão)
          // Exceção: Se o frame atual for transparente/invisível (o que não deve ocorrer)
          ground.setVisible(false)
          
          // 2. Configurar Sprite
          if (sprite.texture.key !== 'tiles') {
            sprite.setTexture('tiles')
          }
          sprite.setFrame(frameIndex)
          
          // Resetar propriedades para o padrão do spritesheet
          sprite.setScale(1)
          sprite.setOrigin(0.5, 0.5)
          
          // Restaurar posição padrão do spritesheet (calculada para frames de 230px de altura)
          sprite.y = y - SPRITE_HEIGHT / 2 + TILE_HEIGHT + 35
          sprite.x = x
          
          sprite.setFlipX(false) // Tiles padrão geralmente não giram dessa forma
        }
      }
    }
  }
  
  updateConnectionIndicators() {
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const indicator = this.connectionIndicators[i][j]
        indicator.clear()
        
        const tile = this.cityManager.getTile(i, j)
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        
        if (building.type !== BUILDING_TYPES.TERRAIN && building.type !== BUILDING_TYPES.ROAD) {
          const isConnected = this.cityManager.isTileConnected(i, j)
          const { x, y } = this.isoToScreen(i, j)
          
          if (!isConnected) {
            indicator.setVisible(true)
            indicator.fillStyle(0xff4444, 0.9)
            indicator.fillCircle(x, y - 60, 8)
            indicator.fillStyle(0xffffff)
            indicator.fillRect(x - 1.5, y - 66, 3, 7)
            indicator.fillCircle(x, y - 55, 2)
          } else {
            indicator.setVisible(false)
          }
        } else {
          indicator.setVisible(false)
        }
      }
    }
  }
  
  updateHUD(stats) {
    this.hudElements.money.setText(`$${stats.money.toLocaleString()}`)
    
    const incomeSign = stats.netIncome >= 0 ? '+' : ''
    this.hudElements.income.setText(`${incomeSign}$${stats.netIncome}/s`)
    this.hudElements.income.setColor(stats.netIncome >= 0 ? '#4ade80' : '#f87171')
    
    this.hudElements.population.setText(stats.population.toLocaleString())
    
    this.hudElements.happiness.setText(`${stats.happiness}%`)
    this.hudElements.happiness.setColor(stats.happiness >= 60 ? '#4ade80' : stats.happiness >= 40 ? '#fbbf24' : '#f87171')
    
    this.hudElements.pollution.setText(stats.pollution.toString())
    
    const connected = stats.connectedBuildings || 0
    const total = connected + (stats.disconnectedBuildings || 0)
    this.hudElements.roads.setText(`${connected}/${total}`)
    this.hudElements.roads.setColor(stats.disconnectedBuildings > 0 ? '#f87171' : '#4ade80')
  }
  
  showNotification(message, type = 'info') {
    const colors = {
      info: '#3b82f6',
      error: '#ef4444',
      success: '#22c55e'
    }
    
    const notification = this.add.text(this.scale.width / 2, 80, message, {
      font: 'bold 16px Arial',
      color: '#ffffff',
      backgroundColor: colors[type],
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5).setDepth(100)
    
    this.tweens.add({
      targets: notification,
      alpha: 0,
      y: 60,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => notification.destroy()
    })
  }
  
  startGameLoop() {
    const tickTime = GAME_CONFIG.GAME_TICK_MS / this.cityManager.gameSpeed
    this.gameTimer = this.time.addEvent({
      delay: tickTime,
      callback: () => this.cityManager.tick(),
      loop: true
    })
  }
  
  restartGameLoop() {
    if (this.gameTimer) {
      this.gameTimer.destroy()
    }
    this.startGameLoop()
  }
  
  saveStateToURL() {
    const state = this.cityManager.exportState()
    history.replaceState(null, '', `#${state}`)
  }
  
  loadStateFromURL() {
    const hash = window.location.hash.substring(1)
    if (hash) {
      this.cityManager.importState(hash)
      this.updateMapDisplay()
      this.updateConnectionIndicators()
    }
  }
}
