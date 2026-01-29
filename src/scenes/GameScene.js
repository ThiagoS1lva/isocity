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
    this.inspectedTile = null // { x, y } do tile sendo inspecionado
    this.isDemolishMode = false // Modo demolição ativo
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
    this.createDemolishButton()
    this.createBottomToolbar()
    this.setupInput()
    this.setupCameraControls()
    this.startGameLoop()
    
    this.cityManager.addListener((stats) => {
      this.updateHUD(stats)
      this.updateInspectorIfOpen()
    })
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
    this.createRCIBars()
  }
  
  createRCIBars() {
    const barWidth = 24
    const barHeight = 60
    const spacing = 8
    const startX = 700
    const centerY = 25
    
    // Container principal
    this.rciContainer = this.add.container(startX, centerY - barHeight / 2 - 5)
    this.rciContainer.setDepth(21)
    
    // Painel de fundo
    const panelWidth = (barWidth + spacing) * 3 + 20
    const panelHeight = barHeight + 30
    const bgGraphics = this.add.graphics()
    bgGraphics.fillStyle(0x1f2937, 0.95)
    bgGraphics.fillRoundedRect(-10, -10, panelWidth, panelHeight, 8)
    bgGraphics.lineStyle(1, 0x374151)
    bgGraphics.strokeRoundedRect(-10, -10, panelWidth, panelHeight, 8)
    this.rciContainer.add(bgGraphics)
    
    // Título
    const title = this.add.text(panelWidth / 2 - 10, -5, 'DEMANDA', {
      font: 'bold 8px Arial',
      color: '#6b7280'
    }).setOrigin(0.5, 0)
    this.rciContainer.add(title)
    
    // Configuração das barras
    const labels = ['R', 'C', 'I']
    const fullLabels = ['Residencial', 'Comercial', 'Industrial']
    const colors = [0x22c55e, 0x3b82f6, 0xeab308]
    
    this.rciBars = []
    
    labels.forEach((label, i) => {
      const x = i * (barWidth + spacing)
      const barY = 10
      
      // Fundo da barra (escuro)
      const barBg = this.add.graphics()
      barBg.fillStyle(0x111827)
      barBg.fillRoundedRect(x, barY, barWidth, barHeight, 4)
      this.rciContainer.add(barBg)
      
      // Linha central (zero)
      const zeroLine = this.add.graphics()
      zeroLine.lineStyle(2, 0x4b5563)
      zeroLine.lineBetween(x + 2, barY + barHeight / 2, x + barWidth - 2, barY + barHeight / 2)
      this.rciContainer.add(zeroLine)
      
      // Barra de preenchimento
      const demandBar = this.add.graphics()
      this.rciContainer.add(demandBar)
      
      // Borda da barra
      const barBorder = this.add.graphics()
      barBorder.lineStyle(1, colors[i], 0.5)
      barBorder.strokeRoundedRect(x, barY, barWidth, barHeight, 4)
      this.rciContainer.add(barBorder)
      
      // Label da letra
      const labelText = this.add.text(x + barWidth / 2, barY + barHeight + 8, label, {
        font: 'bold 12px Arial',
        color: `#${colors[i].toString(16).padStart(6, '0')}`
      }).setOrigin(0.5)
      this.rciContainer.add(labelText)
      
      // Valor numérico (será atualizado)
      const valueText = this.add.text(x + barWidth / 2, barY - 2, '0', {
        font: 'bold 9px Arial',
        color: '#9ca3af'
      }).setOrigin(0.5, 1)
      this.rciContainer.add(valueText)
      
      // Área interativa para tooltip
      const hitArea = this.add.rectangle(x + barWidth / 2, barY + barHeight / 2, barWidth + 4, barHeight + 20, 0x000000, 0)
      hitArea.setInteractive({ useHandCursor: true })
      hitArea.on('pointerover', () => {
        this.showRCITooltip(fullLabels[i], colors[i], x + barWidth / 2 + startX, centerY + barHeight)
      })
      hitArea.on('pointerout', () => this.hideTooltip())
      this.rciContainer.add(hitArea)
      
      this.rciBars.push({ 
        bar: demandBar, 
        valueText,
        color: colors[i], 
        x, 
        y: barY,
        width: barWidth, 
        height: barHeight 
      })
    })
  }
  
  showRCITooltip(label, color, x, y) {
    if (this.rciTooltip) this.rciTooltip.destroy()
    
    const colorHex = `#${color.toString(16).padStart(6, '0')}`
    this.rciTooltip = this.add.text(x, y + 15, label, {
      font: 'bold 11px Arial',
      color: colorHex,
      backgroundColor: '#1f2937',
      padding: { x: 8, y: 4 }
    }).setOrigin(0.5, 0).setDepth(100)
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
  
  createDemolishButton() {
    const x = this.scale.width - 200
    const y = 25
    
    this.demolishBtn = this.add.text(x, y, '🚧 Demolir', {
      font: 'bold 13px Arial',
      color: '#ffffff',
      backgroundColor: '#374151',
      padding: { x: 12, y: 6 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(21)
    
    this.demolishBtn.on('pointerdown', () => this.toggleDemolishMode())
  }
  
  toggleDemolishMode() {
    this.isDemolishMode = !this.isDemolishMode
    this.updateDemolishButton()
    
    if (this.isDemolishMode) {
      this.showNotification('Modo Demolição ATIVO - Clique para demolir', 'error')
    } else {
      this.showNotification('Modo Demolição desativado', 'info')
    }
  }
  
  updateDemolishButton() {
    if (this.isDemolishMode) {
      this.demolishBtn.setStyle({ backgroundColor: '#dc2626', color: '#ffffff' })
      this.demolishBtn.setText('🚧 DEMOLINDO')
    } else {
      this.demolishBtn.setStyle({ backgroundColor: '#374151', color: '#ffffff' })
      this.demolishBtn.setText('🚧 Demolir')
    }
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
    if (this.rciTooltip) {
      this.rciTooltip.destroy()
      this.rciTooltip = null
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
    
    this.controlsHint = this.add.text(10, this.scale.height - 195, 'WASD: Mover | Scroll: Zoom | R: Rotacionar | SHIFT+Clique: Inspecionar', {
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
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    const pos = this.screenToIso(pointer.x, pointer.y)
    
    if (pos.x >= 0 && pos.x < MAP_SIZE && pos.y >= 0 && pos.y < MAP_SIZE) {
      const isInspect = this.keys.space.isDown || this.input.keyboard.addKey('SHIFT').isDown
      
      if (isInspect) {
        this.showInspector(pos.x, pos.y)
        return
      }
      
      // Verificar o que já existe no tile
      const existingTile = this.cityManager.getTile(pos.x, pos.y)
      const existingIndex = existingTile.row * TEXTURE_COLS + existingTile.col
      const existingBuilding = getBuilding(existingIndex)
      const isExistingBuilding = existingBuilding.type !== BUILDING_TYPES.TERRAIN
      
      if (this.isDemolishMode) {
        // MODO DEMOLIÇÃO ATIVO
        if (isExistingBuilding) {
          this.showConfirmModal(
            `Demolir ${existingBuilding.name}?`,
            `Você receberá $${Math.floor(existingBuilding.cost * 0.5)} de volta.`,
            () => {
              this.cityManager.clearTile(pos.x, pos.y)
              this.hideInspector()
              this.updateMapDisplay()
              this.updateConnectionIndicators()
              this.saveStateToURL()
            }
          )
        }
      } else {
        // MODO CONSTRUÇÃO
        const newIndex = this.selectedTile.row * TEXTURE_COLS + this.selectedTile.col
        const newBuilding = getBuilding(newIndex)
        
        if (isExistingBuilding && existingIndex !== newIndex) {
          // SUBSTITUIR - Pedir confirmação
          this.showConfirmModal(
            `Substituir ${existingBuilding.name}?`,
            `Será substituído por ${newBuilding.name} (-$${newBuilding.cost})`,
            () => {
              const result = this.cityManager.setTile(pos.x, pos.y, this.selectedTile.row, this.selectedTile.col, this.currentRotation)
              if (!result.success && result.reason === 'no_money') {
                this.showNotification('Dinheiro insuficiente!', 'error')
              }
              this.updateMapDisplay()
              this.updateConnectionIndicators()
              this.saveStateToURL()
            }
          )
        } else {
          // CONSTRUIR EM TERRENO VAZIO - Sem confirmação
          const result = this.cityManager.setTile(pos.x, pos.y, this.selectedTile.row, this.selectedTile.col, this.currentRotation)
          if (!result.success && result.reason === 'no_money') {
            this.showNotification('Dinheiro insuficiente!', 'error')
          }
          this.updateMapDisplay()
          this.updateConnectionIndicators()
          this.saveStateToURL()
        }
      }
    }
  }
  
  showConfirmModal(title, description, onConfirm) {
    // Destruir modal anterior se existir
    if (this.confirmModal) {
      this.confirmModal.destroy()
    }
    
    const width = this.scale.width
    const height = this.scale.height
    const modalWidth = 320
    const modalHeight = 150
    
    this.confirmModal = this.add.container(width / 2, height / 2)
    this.confirmModal.setDepth(100)
    
    // Fundo escurecido
    const overlay = this.add.rectangle(0, 0, width, height, 0x000000, 0.6)
    overlay.setInteractive() // Bloqueia cliques fora do modal
    this.confirmModal.add(overlay)
    
    // Painel do modal
    const panel = this.add.graphics()
    panel.fillStyle(0x1f2937, 1)
    panel.fillRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 12)
    panel.lineStyle(2, 0x374151)
    panel.strokeRoundedRect(-modalWidth / 2, -modalHeight / 2, modalWidth, modalHeight, 12)
    this.confirmModal.add(panel)
    
    // Título
    const titleText = this.add.text(0, -modalHeight / 2 + 25, title, {
      font: 'bold 16px Arial',
      color: '#ffffff'
    }).setOrigin(0.5)
    this.confirmModal.add(titleText)
    
    // Descrição
    const descText = this.add.text(0, -10, description, {
      font: '13px Arial',
      color: '#9ca3af',
      align: 'center',
      wordWrap: { width: modalWidth - 40 }
    }).setOrigin(0.5)
    this.confirmModal.add(descText)
    
    // Botão Cancelar
    const cancelBtn = this.add.text(-60, modalHeight / 2 - 35, 'Cancelar', {
      font: 'bold 14px Arial',
      color: '#ffffff',
      backgroundColor: '#374151',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    cancelBtn.on('pointerover', () => cancelBtn.setStyle({ backgroundColor: '#4b5563' }))
    cancelBtn.on('pointerout', () => cancelBtn.setStyle({ backgroundColor: '#374151' }))
    cancelBtn.on('pointerdown', () => this.hideConfirmModal())
    this.confirmModal.add(cancelBtn)
    
    // Botão Confirmar
    const confirmBtn = this.add.text(60, modalHeight / 2 - 35, 'Confirmar', {
      font: 'bold 14px Arial',
      color: '#ffffff',
      backgroundColor: '#dc2626',
      padding: { x: 16, y: 8 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    confirmBtn.on('pointerover', () => confirmBtn.setStyle({ backgroundColor: '#ef4444' }))
    confirmBtn.on('pointerout', () => confirmBtn.setStyle({ backgroundColor: '#dc2626' }))
    confirmBtn.on('pointerdown', () => {
      this.hideConfirmModal()
      onConfirm()
    })
    this.confirmModal.add(confirmBtn)
  }
  
  hideConfirmModal() {
    if (this.confirmModal) {
      this.confirmModal.destroy()
      this.confirmModal = null
    }
  }
  
  showInspector(x, y) {
    // Salvar coordenadas para atualização reativa
    this.inspectedTile = { x, y }
    
    const tile = this.cityManager.getTile(x, y)
    const frameIndex = tile.row * GAME_CONFIG.TEXTURE_COLS + tile.col
    const building = getBuilding(frameIndex)
    
    // Se for terreno vazio, não mostrar
    if (building.type === BUILDING_TYPES.TERRAIN) {
      this.hideInspector()
      return
    }
    
    const isConnected = this.cityManager.isTileConnected(x, y) || building.type === BUILDING_TYPES.ROAD
    const occupancy = tile.occupancy !== undefined ? tile.occupancy : 100
    
    // Destruir painel anterior
    if (this.inspectorPanel) {
      this.inspectorPanel.destroy()
    }
    
    // Criar painel
    const panelWidth = 220
    const panelHeight = 200
    const panelX = this.scale.width - panelWidth - 20
    const panelY = 70
    
    this.inspectorPanel = this.add.container(panelX, panelY)
    this.inspectorPanel.setDepth(50)
    
    // Fundo
    const bg = this.add.graphics()
    bg.fillStyle(0x1f2937, 0.95)
    bg.fillRoundedRect(0, 0, panelWidth, panelHeight, 10)
    bg.lineStyle(2, CATEGORY_INFO[building.type]?.color || 0x6b7280)
    bg.strokeRoundedRect(0, 0, panelWidth, panelHeight, 10)
    this.inspectorPanel.add(bg)
    
    // Título
    const title = this.add.text(panelWidth / 2, 15, building.name, {
      font: 'bold 14px Arial',
      color: '#ffffff'
    }).setOrigin(0.5, 0)
    this.inspectorPanel.add(title)
    
    // Tipo
    const typeColor = CATEGORY_INFO[building.type]?.color || 0x6b7280
    const typeText = this.add.text(panelWidth / 2, 35, building.type.toUpperCase(), {
      font: 'bold 10px Arial',
      color: `#${typeColor.toString(16).padStart(6, '0')}`
    }).setOrigin(0.5, 0)
    this.inspectorPanel.add(typeText)
    
    // Linha separadora
    const separator = this.add.graphics()
    separator.lineStyle(1, 0x374151)
    separator.lineBetween(15, 55, panelWidth - 15, 55)
    this.inspectorPanel.add(separator)
    
    // Detalhes
    const details = []
    
    // Status de conexão
    const connStatus = isConnected ? '✅ Conectado' : '❌ Desconectado'
    const connColor = isConnected ? '#4ade80' : '#f87171'
    details.push({ label: 'Status', value: connStatus, color: connColor })
    
    // Ocupação (se aplicável)
    if (building.type !== BUILDING_TYPES.ROAD) {
      const occBar = `${'█'.repeat(Math.floor(occupancy / 10))}${'░'.repeat(10 - Math.floor(occupancy / 10))}`
      details.push({ label: 'Ocupação', value: `${Math.round(occupancy)}% ${occBar}`, color: '#60a5fa' })
    }
    
    // População
    if (building.population) {
      const actualPop = Math.floor(building.population * (occupancy / 100) * (isConnected ? 1 : 0.1))
      details.push({ label: 'População', value: `${actualPop}/${building.population}`, color: '#f472b6' })
    }
    
    // Empregos
    if (building.jobs) {
      const actualJobs = Math.floor(building.jobs * (occupancy / 100) * (isConnected ? 1 : 0.1))
      details.push({ label: 'Empregos', value: `${actualJobs}/${building.jobs}`, color: '#fbbf24' })
    }
    
    // Renda
    if (building.income > 0) {
      const actualIncome = Math.floor(building.income * (occupancy / 100) * (isConnected ? 1 : 0.1))
      details.push({ label: 'Renda', value: `+$${actualIncome}/s`, color: '#4ade80' })
    } else if (building.income < 0) {
      details.push({ label: 'Manutenção', value: `-$${Math.abs(building.income)}/s`, color: '#f87171' })
    }
    
    // Serviços
    if (building.safety) details.push({ label: 'Segurança', value: `+${building.safety}`, color: '#ef4444' })
    if (building.health) details.push({ label: 'Saúde', value: `+${building.health}`, color: '#22c55e' })
    if (building.happiness) details.push({ label: 'Felicidade', value: `+${building.happiness}`, color: '#f472b6' })
    if (building.pollution) details.push({ label: 'Poluição', value: `+${building.pollution}`, color: '#9ca3af' })
    
    // Renderizar detalhes
    let yOffset = 65
    details.forEach(detail => {
      const labelText = this.add.text(15, yOffset, detail.label + ':', {
        font: '11px Arial',
        color: '#9ca3af'
      })
      this.inspectorPanel.add(labelText)
      
      const valueText = this.add.text(panelWidth - 15, yOffset, detail.value, {
        font: 'bold 11px Arial',
        color: detail.color
      }).setOrigin(1, 0)
      this.inspectorPanel.add(valueText)
      
      yOffset += 18
    })
    
    // Botão Fechar
    const closeBtn = this.add.text(panelWidth - 10, 5, '✕', {
      font: 'bold 14px Arial',
      color: '#9ca3af'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true })
    closeBtn.on('pointerover', () => closeBtn.setColor('#ffffff'))
    closeBtn.on('pointerout', () => closeBtn.setColor('#9ca3af'))
    closeBtn.on('pointerdown', () => this.hideInspector())
    this.inspectorPanel.add(closeBtn)
    
    // Ajustar altura do painel baseado no conteúdo
    bg.clear()
    bg.fillStyle(0x1f2937, 0.95)
    bg.fillRoundedRect(0, 0, panelWidth, yOffset + 15, 10)
    bg.lineStyle(2, CATEGORY_INFO[building.type]?.color || 0x6b7280)
    bg.strokeRoundedRect(0, 0, panelWidth, yOffset + 15, 10)
  }
  
  hideInspector() {
    if (this.inspectorPanel) {
      this.inspectorPanel.destroy()
      this.inspectorPanel = null
    }
    this.inspectedTile = null
  }
  
  updateInspectorIfOpen() {
    if (this.inspectedTile && this.inspectorPanel) {
      this.showInspector(this.inspectedTile.x, this.inspectedTile.y)
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
        
        // Guardar rotação para aplicar depois
        const rotation = tile.rotation || 0
        
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
        }
        
        // Aplicar rotação para TODOS os tipos de construção
        // Exceto terreno (grama) e estradas (que usam auto-tile)
        if (building.type !== BUILDING_TYPES.TERRAIN && building.type !== BUILDING_TYPES.ROAD) {
          sprite.setFlipX(rotation === 1)
        } else {
          sprite.setFlipX(false)
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
    
    // Atualizar Barras RCI
    this.updateRCIBars(stats)
  }
  
  updateRCIBars(stats) {
    if (!this.rciBars) return
    
    const demands = [
      stats.demandResidential || 0,
      stats.demandCommercial || 0,
      stats.demandIndustrial || 0
    ]
    
    this.rciBars.forEach((barData, i) => {
      const demand = demands[i]
      const { bar, valueText, color, x, y, width, height } = barData
      
      bar.clear()
      
      // Atualizar texto do valor
      const sign = demand > 0 ? '+' : ''
      valueText.setText(`${sign}${demand}`)
      valueText.setColor(demand > 0 ? '#4ade80' : demand < 0 ? '#f87171' : '#9ca3af')
      
      // Calcular altura da barra
      const maxHeight = height / 2 - 4
      const barFillHeight = Math.abs(demand) / 100 * maxHeight
      
      if (demand > 0) {
        // Demanda positiva: barra sobe do centro
        bar.fillStyle(color, 0.9)
        bar.fillRoundedRect(x + 2, y + height / 2 - barFillHeight, width - 4, barFillHeight, 2)
      } else if (demand < 0) {
        // Excesso: barra desce do centro (mais transparente)
        bar.fillStyle(color, 0.4)
        bar.fillRoundedRect(x + 2, y + height / 2, width - 4, barFillHeight, 2)
      }
    })
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
