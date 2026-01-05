import { GAME_CONFIG } from '../config/game.js'
import { getBuilding, BUILDING_TYPES, ROAD_AUTO_TILES } from '../config/buildings.js'

export class RoadSystem {
  constructor(cityManager) {
    this.cityManager = cityManager
    this.graph = new Map() // "x,y" -> Set("x,y")
  }
  
  // ... (métodos existentes updateConnections, buildGraph, bfs) ...
  
  updateConnections() {
    this.buildGraph()
  }

  // Novo método para calcular o frame da estrada
  getAutoTileFrame(x, y) {
    let mask = 0
    const { MAP_SIZE } = GAME_CONFIG
  
    const check = (nx, ny, bit) => {
      if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
        const tile = this.cityManager.getTile(nx, ny)
        // Precisamos saber se o tile vizinho é uma estrada
        const index = tile.row * 12 + tile.col // Assumindo 12 colunas padrão
        const building = getBuilding(index)
        
        if (building.type === BUILDING_TYPES.ROAD) {
          mask |= bit
        }
      }
    }
    
    check(x, y - 1, 1) // N
    check(x + 1, y, 2) // E
    check(x, y + 1, 4) // S
    check(x - 1, y, 8) // W
    
    return ROAD_AUTO_TILES[mask] || 2 // Default reta vertical
  }
  
  updateRoadVisuals(x, y) {
    // Atualiza a estrada em x,y e seus vizinhos
    const neighbors = [
      {x, y},
      {x: x, y: y - 1},
      {x: x + 1, y: y},
      {x: x, y: y + 1},
      {x: x - 1, y: y}
    ]
    
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    
    neighbors.forEach(pos => {
      if (pos.x >= 0 && pos.x < MAP_SIZE && pos.y >= 0 && pos.y < MAP_SIZE) {
        const tile = this.cityManager.getTile(pos.x, pos.y)
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        
        // Se for estrada (e for inteligente, ou queremos forçar todas?),
        // Vamos atualizar se for ESTRADA
        if (building.type === BUILDING_TYPES.ROAD) {
           const newFrame = this.getAutoTileFrame(pos.x, pos.y)
           
           // Atualizar tile no map
           const buildingRow = Math.floor(newFrame / TEXTURE_COLS)
           const buildingCol = newFrame % TEXTURE_COLS
           
           // Hack direto no map para evitar gastar dinheiro/loop
           this.cityManager.map[pos.x][pos.y].row = buildingRow
           this.cityManager.map[pos.x][pos.y].col = buildingCol
        }
      }
    })
  }

  buildGraph() {
    this.graph.clear()
    const { MAP_SIZE, TEXTURE_COLS } = GAME_CONFIG
    
    // Helper to check if connected
    const isConnected = (b1, b2) => {
      return (b1.type === BUILDING_TYPES.ROAD && b2.type !== BUILDING_TYPES.TERRAIN) ||
             (b1.type !== BUILDING_TYPES.TERRAIN && b2.type === BUILDING_TYPES.ROAD) ||
             (b1.type === BUILDING_TYPES.ROAD && b2.type === BUILDING_TYPES.ROAD)
    }

    for (let x = 0; x < MAP_SIZE; x++) {
      for (let y = 0; y < MAP_SIZE; y++) {
        const tile = this.cityManager.getTile(x, y)
        const index = tile.row * TEXTURE_COLS + tile.col
        const building = getBuilding(index)
        
        if (building.type === BUILDING_TYPES.TERRAIN) continue
        
        const key = `${x},${y}`
        if (!this.graph.has(key)) {
          this.graph.set(key, new Set())
        }
        
        // Check 4 neighbors
        const neighbors = [
          { nx: x - 1, ny: y },
          { nx: x + 1, ny: y },
          { nx: x, ny: y - 1 },
          { nx: x, ny: y + 1 }
        ]
        
        for (const { nx, ny } of neighbors) {
          if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
            const nTile = this.cityManager.getTile(nx, ny)
            const nIndex = nTile.row * TEXTURE_COLS + nTile.col
            const nBuilding = getBuilding(nIndex)
            
            if (isConnected(building, nBuilding)) {
              this.graph.get(key).add(`${nx},${ny}`)
            }
          }
        }
      }
    }
  }

  // BFS to check connectivity to main road network (starting from road at 5,5 or first found road)
  isConnected(x, y) {
    const key = `${x},${y}`
    if (!this.graph.has(key)) return false
    // Se está no grafo, tem pelo menos uma conexão válida (estrada ou prédio conectado a estrada)
    return this.graph.get(key).size > 0
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
