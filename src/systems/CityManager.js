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
  
  setTile(x, y, row, col) {
    if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
      const index = row * GAME_CONFIG.TEXTURE_COLS + col
      const building = getBuilding(index)
      
      if (this.money < building.cost) {
        return { success: false, reason: 'no_money' }
      }
      
      this.money -= building.cost
      this.map[x][y] = { row, col }
      this.roadSystem.updateConnections()
      this.calculateStats()
      this.notifyListeners()
      
      return { success: true }
    }
    return { success: false, reason: 'invalid_position' }
  }
  
  clearTile(x, y) {
    if (x >= 0 && x < GAME_CONFIG.MAP_SIZE && y >= 0 && y < GAME_CONFIG.MAP_SIZE) {
      this.map[x][y] = { row: 0, col: 0 }
      this.roadSystem.updateConnections()
      this.calculateStats()
      this.notifyListeners()
      return true
    }
    return false
  }
  
  isTileConnected(x, y) {
    return this.roadSystem.isConnected(x, y)
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
