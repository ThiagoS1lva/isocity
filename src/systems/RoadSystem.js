import { GAME_CONFIG } from '../config/game.js'
import { BUILDING_TYPES, getBuilding } from '../config/buildings.js'

export class RoadSystem {
  constructor(cityManager) {
    this.cityManager = cityManager
    this.connectedTiles = new Set()
  }
  
  updateConnections() {
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    const map = this.cityManager.map
    
    this.connectedTiles.clear()
    
    const roadTiles = []
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const tile = map[i][j]
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        if (building.type === BUILDING_TYPES.ROAD) {
          roadTiles.push({ x: i, y: j })
        }
      }
    }
    
    const visited = new Set()
    const queue = [...roadTiles]
    
    while (queue.length > 0) {
      const { x, y } = queue.shift()
      const key = `${x},${y}`
      
      if (visited.has(key)) continue
      visited.add(key)
      this.connectedTiles.add(key)
      
      const neighbors = this.getNeighbors(x, y)
      for (const neighbor of neighbors) {
        const nKey = `${neighbor.x},${neighbor.y}`
        if (!visited.has(nKey)) {
          const tile = map[neighbor.x]?.[neighbor.y]
          if (tile) {
            const index = tile.row * TEXTURE_COLS + tile.col
            const building = getBuilding(index)
            if (building.type === BUILDING_TYPES.ROAD) {
              queue.push(neighbor)
            } else if (building.type !== BUILDING_TYPES.TERRAIN) {
              this.connectedTiles.add(nKey)
            }
          }
        }
      }
    }
  }
  
  getNeighbors(x, y) {
    return [
      { x: x - 1, y },
      { x: x + 1, y },
      { x, y: y - 1 },
      { x, y: y + 1 }
    ].filter(n => 
      n.x >= 0 && n.x < GAME_CONFIG.MAP_SIZE && 
      n.y >= 0 && n.y < GAME_CONFIG.MAP_SIZE
    )
  }
  
  isConnected(x, y) {
    return this.connectedTiles.has(`${x},${y}`)
  }
  
  isAdjacentToRoad(x, y) {
    const { TEXTURE_COLS } = GAME_CONFIG
    const map = this.cityManager.map
    const neighbors = this.getNeighbors(x, y)
    
    for (const neighbor of neighbors) {
      const tile = map[neighbor.x]?.[neighbor.y]
      if (tile) {
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        if (building.type === BUILDING_TYPES.ROAD) {
          return true
        }
      }
    }
    return false
  }
  
  getConnectionStats() {
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    const map = this.cityManager.map
    
    let connected = 0
    let disconnected = 0
    let roads = 0
    
    for (let i = 0; i < MAP_SIZE; i++) {
      for (let j = 0; j < MAP_SIZE; j++) {
        const tile = map[i][j]
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        
        if (building.type === BUILDING_TYPES.TERRAIN) continue
        
        if (building.type === BUILDING_TYPES.ROAD) {
          roads++
        } else if (this.isConnected(i, j)) {
          connected++
        } else {
          disconnected++
        }
      }
    }
    
    return { connected, disconnected, roads }
  }
}
