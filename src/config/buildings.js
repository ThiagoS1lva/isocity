export const BUILDING_TYPES = {
  TERRAIN: 'terrain',
  ROAD: 'road',
  RESIDENTIAL: 'residential',
  COMMERCIAL: 'commercial',
  INDUSTRIAL: 'industrial',
  SERVICE: 'service',
  DECORATION: 'decoration',
  NATURE: 'nature',
  LANDMARK: 'landmark',
  UTILITY: 'utility'
}

export const CATEGORY_INFO = {
  [BUILDING_TYPES.TERRAIN]: { name: 'Terreno', color: 0x22c55e },
  [BUILDING_TYPES.ROAD]: { name: 'Estradas', color: 0x6b7280 },
  [BUILDING_TYPES.RESIDENTIAL]: { name: 'Residencial', color: 0x3b82f6 },
  [BUILDING_TYPES.COMMERCIAL]: { name: 'Comercial', color: 0xf59e0b },
  [BUILDING_TYPES.INDUSTRIAL]: { name: 'Industrial', color: 0x8b5cf6 },
  [BUILDING_TYPES.SERVICE]: { name: 'Serviços', color: 0xef4444 },
  [BUILDING_TYPES.DECORATION]: { name: 'Decoração', color: 0xec4899 },
  [BUILDING_TYPES.NATURE]: { name: 'Natureza', color: 0x10b981 },
  [BUILDING_TYPES.LANDMARK]: { name: 'Marcos', color: 0xf97316 },
  [BUILDING_TYPES.UTILITY]: { name: 'Utilidades', color: 0xeab308 }
}

export const BUILDINGS = {
  0: { name: 'Grama', cost: 0, income: 0, population: 0, type: BUILDING_TYPES.TERRAIN },
  1: { name: 'Água', cost: 50, income: 0, population: 0, type: BUILDING_TYPES.TERRAIN },
  2: { name: 'Areia', cost: 10, income: 0, population: 0, type: BUILDING_TYPES.TERRAIN },
  3: { name: 'Terra', cost: 5, income: 0, population: 0, type: BUILDING_TYPES.TERRAIN },
  
  4: { name: 'Estrada Reta', cost: 20, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  5: { name: 'Estrada Curva', cost: 20, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  6: { name: 'Cruzamento', cost: 25, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  7: { name: 'Estrada T', cost: 22, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  8: { name: 'Estrada Fim', cost: 20, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  9: { name: 'Ponte', cost: 50, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  10: { name: 'Trilhos', cost: 30, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  11: { name: 'Calçada', cost: 15, income: 0, population: 0, type: BUILDING_TYPES.ROAD },
  
  12: { name: 'Casa Pequena', cost: 100, income: 10, population: 5, happiness: 2, type: BUILDING_TYPES.RESIDENTIAL },
  13: { name: 'Casa Média', cost: 200, income: 20, population: 10, happiness: 3, type: BUILDING_TYPES.RESIDENTIAL },
  14: { name: 'Casa Grande', cost: 350, income: 35, population: 20, happiness: 4, type: BUILDING_TYPES.RESIDENTIAL },
  15: { name: 'Prédio', cost: 500, income: 50, population: 50, happiness: 2, type: BUILDING_TYPES.RESIDENTIAL },
  
  16: { name: 'Loja', cost: 150, income: 25, population: 0, jobs: 5, type: BUILDING_TYPES.COMMERCIAL },
  17: { name: 'Mercado', cost: 300, income: 45, population: 0, jobs: 10, type: BUILDING_TYPES.COMMERCIAL },
  18: { name: 'Shopping', cost: 800, income: 100, population: 0, jobs: 30, happiness: 5, type: BUILDING_TYPES.COMMERCIAL },
  19: { name: 'Escritório', cost: 400, income: 60, population: 0, jobs: 20, type: BUILDING_TYPES.COMMERCIAL },
  
  20: { name: 'Fábrica Pequena', cost: 250, income: 40, population: 0, jobs: 15, pollution: 3, type: BUILDING_TYPES.INDUSTRIAL },
  21: { name: 'Fábrica Grande', cost: 500, income: 80, population: 0, jobs: 30, pollution: 6, type: BUILDING_TYPES.INDUSTRIAL },
  22: { name: 'Armazém', cost: 200, income: 20, population: 0, jobs: 5, pollution: 1, type: BUILDING_TYPES.INDUSTRIAL },
  23: { name: 'Usina', cost: 1000, income: 0, population: 0, energy: 100, pollution: 10, type: BUILDING_TYPES.UTILITY },
  
  24: { name: 'Delegacia', cost: 400, income: -15, population: 0, safety: 20, type: BUILDING_TYPES.SERVICE },
  25: { name: 'Hospital', cost: 600, income: -25, population: 0, health: 25, happiness: 5, type: BUILDING_TYPES.SERVICE },
  26: { name: 'Escola', cost: 350, income: -10, population: 0, education: 15, happiness: 3, type: BUILDING_TYPES.SERVICE },
  27: { name: 'Bombeiros', cost: 400, income: -15, population: 0, safety: 15, type: BUILDING_TYPES.SERVICE },
  
  28: { name: 'Parque Pequeno', cost: 80, income: 0, population: 0, happiness: 8, pollution: -2, type: BUILDING_TYPES.DECORATION },
  29: { name: 'Parque Grande', cost: 150, income: 0, population: 0, happiness: 15, pollution: -4, type: BUILDING_TYPES.DECORATION },
  30: { name: 'Praça', cost: 100, income: 0, population: 0, happiness: 10, type: BUILDING_TYPES.DECORATION },
  31: { name: 'Fonte', cost: 120, income: 0, population: 0, happiness: 12, type: BUILDING_TYPES.DECORATION },
  
  32: { name: 'Árvore', cost: 15, income: 0, population: 0, happiness: 2, pollution: -1, type: BUILDING_TYPES.NATURE },
  33: { name: 'Floresta', cost: 30, income: 0, population: 0, happiness: 4, pollution: -2, type: BUILDING_TYPES.NATURE },
  
  34: { name: 'Igreja', cost: 250, income: 0, population: 0, happiness: 10, type: BUILDING_TYPES.LANDMARK },
  35: { name: 'Monumento', cost: 500, income: 5, population: 0, happiness: 15, type: BUILDING_TYPES.LANDMARK }
}

for (let i = 36; i < 72; i++) {
  BUILDINGS[i] = { name: 'Decoração', cost: 25, income: 0, population: 0, happiness: 1, type: BUILDING_TYPES.DECORATION }
}

export function getBuilding(index) {
  return BUILDINGS[index] || BUILDINGS[0]
}

export function getBuildingByTile(row, col, textureCols = 12) {
  return getBuilding(row * textureCols + col)
}

export function getBuildingsByCategory(category) {
  const result = []
  for (const [index, building] of Object.entries(BUILDINGS)) {
    if (building.type === category) {
      result.push({ index: parseInt(index), ...building })
    }
  }
  return result
}

export function getAllCategories() {
  const categories = new Set()
  for (const building of Object.values(BUILDINGS)) {
    categories.add(building.type)
  }
  return Array.from(categories)
}
