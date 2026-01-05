import { GAME_CONFIG } from '../config/game.js'
import { getBuilding, BUILDING_TYPES } from '../config/buildings.js'
import { RoadSystem } from './RoadSystem.js'

export class CityManager {
  constructor() {
    this.money = GAME_CONFIG.STARTING_MONEY
    this.population = 0
    this.happiness = 50
    this.income = 0
    this.expenses = 0
    this.pollution = 0
    this.jobs = 0
    this.safety = 0
    this.health = 0
    this.education = 0
    this.connectedBuildings = 0
    this.disconnectedBuildings = 0
    
    this.gameSpeed = 1
    this.isPaused = false
    this.tickCount = 0
    
    this.map = this.createEmptyMap()
    this.listeners = []
    
    this.roadSystem = new RoadSystem(this)
  }
  
  createEmptyMap() {
    const { MAP_SIZE } = GAME_CONFIG
    return Array.from({ length: MAP_SIZE }, () =>
      Array.from({ length: MAP_SIZE }, () => ({ row: 0, col: 0 }))
    )
  }
  
  getTile(x, y) {
    if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
      return this.map[x][y]
    }
    return null
  }

  // Helper to get building info from map coordinates (row, col)
  getBuildingInfo(buildingRow, buildingCol) {
    const index = buildingRow * GAME_CONFIG.TEXTURE_COLS + buildingCol;
    return getBuilding(index);
  }

  // Helper to get cost from map coordinates (row, col)
  getCost(buildingRow, buildingCol) {
    const building = this.getBuildingInfo(buildingRow, buildingCol);
    return building.cost;
  }
  
  setTile(x, y, buildingRow, buildingCol, rotation = 0) {
    if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
      if (this.money < this.getCost(buildingRow, buildingCol)) {
        return { success: false, reason: 'no_money' }
      }
      
      const newBuilding = this.getBuildingInfo(buildingRow, buildingCol) // Pegar info original do que estamos construindo
      
      // LÓGICA DE AUTO-TILE DE ESTRADA
      let realRow = buildingRow
      let realCol = buildingCol
      
      if (newBuilding.autoTile) {
        // Se for Estrada Inteligente, calcula o frame correto
        // Mas atenção: Precisamos 'fingir' que já colocamos a estrada para o cálculo funcionar?
        // O check olha vizinhos. O próprio x,y ainda é o antigo.
        // O ideal é colocar a estrada no mapa (frame default) e depois atualizar.
        // Ou o getAutoTileFrame olha vizinhos e decide o frame DESTE tile baseada neles.
        // Vizinhos não mudam ainda.
        
        const frameIndex = this.roadSystem.getAutoTileFrame(x, y)
        realRow = Math.floor(frameIndex / GAME_CONFIG.TEXTURE_COLS)
        realCol = frameIndex % GAME_CONFIG.TEXTURE_COLS
      }
      
      const tile = this.map[x][y]
      const previousBuilding = this.getBuildingInfo(tile.row, tile.col)
      
      if (previousBuilding.cost > 0) {
        this.money += Math.floor(previousBuilding.cost * 0.5)
      }
      
      this.money -= newBuilding.cost
      
      this.map[x][y] = { row: realRow, col: realCol, rotation: rotation }
      
      this.roadSystem.updateConnections()
      
      // AUTO-UPDATE VIZINHOS
      if (newBuilding.type === BUILDING_TYPES.ROAD) {
         this.roadSystem.updateRoadVisuals(x, y)
      }
      
      this.calculateStats() 
      this.notifyListeners()
      
      return { success: true }
    }
    return { success: false, reason: 'invalid_position' }
  }
  
  clearTile(x, y) {
    if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
      // Verificar se era estrada antes de apagar
      const tile = this.map[x][y]
      const index = tile.row * GAME_CONFIG.TEXTURE_COLS + tile.col
      const wasRoad = getBuilding(index).type === BUILDING_TYPES.ROAD
      
      this.map[x][y] = { row: 0, col: 0 }
      
      this.roadSystem.updateConnections()
      
      if (wasRoad) {
        this.roadSystem.updateRoadVisuals(x, y)
      }
      
      this.calculateStats()
      this.notifyListeners()
      return true
    }
    return false
  }
  
  isTileConnected(x, y) {
    return this.roadSystem.isConnected(x, y)
  }
  
  canAfford(buildingIndex) {
    const building = getBuilding(buildingIndex)
    return this.money >= building.cost
  }
  
  calculateStats() {
    let totalPopulation = 0
    let totalIncome = 0
    let totalExpenses = 0
    let totalHappiness = 0
    let totalPollution = 0
    let totalJobs = 0
    let totalSafety = 0
    let totalHealth = 0
    let totalEducation = 0
    let happinessFactors = 0
    let connected = 0
    let disconnected = 0
    
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const tile = this.map[i][j]
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        
        if (building.type === BUILDING_TYPES.TERRAIN) continue
        
        const isConnected = this.roadSystem.isConnected(i, j) || building.type === BUILDING_TYPES.ROAD
        const multiplier = isConnected ? 1 : 0.1
        
        if (building.type !== BUILDING_TYPES.ROAD) {
          if (isConnected) connected++
          else disconnected++
        }
        
        totalPopulation += Math.floor((building.population || 0) * multiplier)
        totalJobs += Math.floor((building.jobs || 0) * multiplier)
        totalSafety += Math.floor((building.safety || 0) * multiplier)
        totalHealth += Math.floor((building.health || 0) * multiplier)
        totalEducation += Math.floor((building.education || 0) * multiplier)
        
        if (building.income > 0) {
          totalIncome += Math.floor(building.income * multiplier)
        } else if (building.income < 0) {
          totalExpenses += Math.abs(building.income)
        }
        
        if (building.happiness) {
          totalHappiness += Math.floor(building.happiness * multiplier)
          happinessFactors++
        }
        
        totalPollution += building.pollution || 0
      }
    }
    
    this.population = totalPopulation
    this.income = totalIncome
    this.expenses = totalExpenses
    this.pollution = Math.max(0, totalPollution)
    this.jobs = totalJobs
    this.safety = totalSafety
    this.health = totalHealth
    this.education = totalEducation
    this.connectedBuildings = connected
    this.disconnectedBuildings = disconnected
    
    let baseHappiness = 50
    if (happinessFactors > 0) {
      baseHappiness += totalHappiness
    }
    baseHappiness -= this.pollution * 2
    baseHappiness += Math.min(this.safety, 30)
    baseHappiness += Math.min(this.health, 20)
    
    if (disconnected > 0) {
      baseHappiness -= disconnected * 3
    }
    
    this.happiness = Math.max(0, Math.min(100, baseHappiness))
  }
  
  tick() {
    if (this.isPaused) return
    
    this.tickCount++
    const netIncome = this.income - this.expenses
    this.money += netIncome
    
    if (this.money < 0) {
      this.money = 0
    }
    
    this.notifyListeners()
  }
  
  getNetIncome() {
    return this.income - this.expenses
  }
  
  canAfford(buildingIndex) {
    const building = getBuilding(buildingIndex)
    return this.money >= building.cost
  }
  
  setSpeed(speed) {
    this.gameSpeed = speed
    this.isPaused = false
  }
  
  togglePause() {
    this.isPaused = !this.isPaused
  }
  
  addListener(callback) {
    this.listeners.push(callback)
  }
  
  removeListener(callback) {
    this.listeners = this.listeners.filter(cb => cb !== callback)
  }
  
  notifyListeners() {
    this.listeners.forEach(cb => cb(this.getStats()))
  }
  
  getStats() {
    return {
      money: this.money,
      population: this.population,
      happiness: this.happiness,
      income: this.income,
      expenses: this.expenses,
      pollution: this.pollution,
      jobs: this.jobs,
      safety: this.safety,
      health: this.health,
      education: this.education,
      netIncome: this.getNetIncome(),
      isPaused: this.isPaused,
      gameSpeed: this.gameSpeed,
      connectedBuildings: this.connectedBuildings,
      disconnectedBuildings: this.disconnectedBuildings
    }
  }
  
  exportState() {
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    const data = new Uint8Array(MAP_SIZE * MAP_SIZE)
    let index = 0
    
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const tile = this.map[i][j]
        data[index++] = tile.row * TEXTURE_COLS + tile.col
      }
    }
    
    return btoa(String.fromCharCode(...data))
  }
  
  importState(encoded) {
    if (!encoded) return
    
    try {
      const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
      const data = atob(encoded).split('').map(c => c.charCodeAt(0))
      let index = 0
      
      for (let i = 0; i < MAP_SIZE; i++) {
        for (let j = 0; j < MAP_SIZE; j++) {
          const value = data[index++] || 0
          this.map[i][j] = {
            row: Math.floor(value / TEXTURE_COLS),
            col: value % TEXTURE_COLS
          }
        }
      }
      
      this.roadSystem.updateConnections()
      this.calculateStats()
      this.notifyListeners()
    } catch (e) {
      console.error('Failed to import state:', e)
    }
  }
}
