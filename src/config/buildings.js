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

// Vamos mapear TUDO para tentar achar
export const BUILDINGS = {
  // --- TERRENO & ESTRADAS ---
  0: { name: 'Grama', cost: 0, type: BUILDING_TYPES.TERRAIN },
  1: { name: 'Fonte', cost: 150, happiness: 10, type: BUILDING_TYPES.DECORATION },
  
  // Estradas básicas
  2: { name: 'Estrada Reta 1', cost: 20, type: BUILDING_TYPES.ROAD },
  3: { name: 'Curva Suave', cost: 20, type: BUILDING_TYPES.ROAD },
  4: { name: 'Estrada Reta 2', cost: 20, type: BUILDING_TYPES.ROAD },
  5: { name: 'Estrada Arborizada 1', cost: 30, happiness: 1, type: BUILDING_TYPES.ROAD },
  6: { name: 'Estrada Arborizada 2', cost: 30, happiness: 1, type: BUILDING_TYPES.ROAD },
  7: { name: 'Cruzamento', cost: 25, type: BUILDING_TYPES.ROAD },
  8: { name: 'Cruzamento T', cost: 25, type: BUILDING_TYPES.ROAD },
  9: { name: 'Estrada Fim', cost: 20, type: BUILDING_TYPES.ROAD },
  
  // Mais variações de estrada (Linha 2 e 3)
  12: { name: 'Estrada Poste 1', cost: 25, type: BUILDING_TYPES.ROAD },
  13: { name: 'Estrada Poste 2', cost: 25, type: BUILDING_TYPES.ROAD },
  14: { name: 'Estrada Reta 3', cost: 20, type: BUILDING_TYPES.ROAD },
  15: { name: 'Estrada Reta 4', cost: 20, type: BUILDING_TYPES.ROAD },
  16: { name: 'Curva 1', cost: 20, type: BUILDING_TYPES.ROAD },
  17: { name: 'Curva 2', cost: 20, type: BUILDING_TYPES.ROAD },
  18: { name: 'Curva 3', cost: 20, type: BUILDING_TYPES.ROAD },
  19: { name: 'Curva 4', cost: 20, type: BUILDING_TYPES.ROAD },
  20: { name: 'Interseção 1', cost: 25, type: BUILDING_TYPES.ROAD },
  21: { name: 'Interseção 2', cost: 25, type: BUILDING_TYPES.ROAD },
  
  // Linha 3
  24: { name: 'Estrada Diagonal 1', cost: 20, type: BUILDING_TYPES.ROAD },
  25: { name: 'Estrada Diagonal 2', cost: 20, type: BUILDING_TYPES.ROAD },
  26: { name: 'Curva Fechada 1', cost: 20, type: BUILDING_TYPES.ROAD },
  27: { name: 'Curva Fechada 2', cost: 20, type: BUILDING_TYPES.ROAD },
  28: { name: 'Curva Fechada 3', cost: 20, type: BUILDING_TYPES.ROAD },
  29: { name: 'Curva Fechada 4', cost: 20, type: BUILDING_TYPES.ROAD },
  30: { name: 'Calçada Esquina', cost: 15, type: BUILDING_TYPES.ROAD },
  31: { name: 'Calçada Reta', cost: 15, type: BUILDING_TYPES.ROAD },
  32: { name: 'Estrada Curta', cost: 20, type: BUILDING_TYPES.ROAD },
  33: { name: 'Estrada Curta 2', cost: 20, type: BUILDING_TYPES.ROAD },
  34: { name: 'Fim de Rua', cost: 20, type: BUILDING_TYPES.ROAD },
  35: { name: 'Fim de Rua 2', cost: 20, type: BUILDING_TYPES.ROAD },
  
  // Linha 4 (Início)
  36: { name: 'Curva Larga 1', cost: 25, type: BUILDING_TYPES.ROAD },
  37: { name: 'Curva Larga 2', cost: 25, type: BUILDING_TYPES.ROAD },
  38: { name: 'Curva Larga 3', cost: 25, type: BUILDING_TYPES.ROAD },
  39: { name: 'Curva Larga 4', cost: 25, type: BUILDING_TYPES.ROAD },
  40: { name: 'Interseção Y', cost: 25, type: BUILDING_TYPES.ROAD },
  41: { name: 'Interseção Y 2', cost: 25, type: BUILDING_TYPES.ROAD },
  
  // Água (Decorativo)
  48: { name: 'Canal Reto', cost: 50, happiness: 5, type: BUILDING_TYPES.DECORATION },
  49: { name: 'Canal Canto', cost: 50, happiness: 5, type: BUILDING_TYPES.DECORATION },

  // --- RESIDENCIAL ---
  67: { name: 'Casa Pequena (Vermelha)', cost: 100, population: 4, type: BUILDING_TYPES.RESIDENTIAL },
  69: { name: 'Casa Pequena (Branca)', cost: 100, population: 4, type: BUILDING_TYPES.RESIDENTIAL },
  55: { name: 'Sobrado Branco', cost: 200, population: 8, type: BUILDING_TYPES.RESIDENTIAL },
  53: { name: 'Sobrado Creme', cost: 200, population: 8, type: BUILDING_TYPES.RESIDENTIAL },
  62: { name: 'Apartamento Amarelo', cost: 400, population: 20, type: BUILDING_TYPES.RESIDENTIAL },
  60: { name: 'Apartamento Tijolo', cost: 400, population: 20, type: BUILDING_TYPES.RESIDENTIAL },
  54: { name: 'Residencial Moderno', cost: 600, population: 40, happiness: 5, type: BUILDING_TYPES.RESIDENTIAL },
  58: { name: 'Condomínio Marrom', cost: 500, population: 35, type: BUILDING_TYPES.RESIDENTIAL },
  63: { name: 'Torre Amarela', cost: 1000, population: 80, type: BUILDING_TYPES.RESIDENTIAL },
  61: { name: 'Torre Tijolo', cost: 1000, population: 80, type: BUILDING_TYPES.RESIDENTIAL },

  // --- COMERCIAL ---
  46: { name: 'Loja de Esquina', cost: 200, jobs: 5, income: 20, type: BUILDING_TYPES.COMMERCIAL },
  66: { name: 'Mercadinho Verde', cost: 250, jobs: 6, income: 25, type: BUILDING_TYPES.COMMERCIAL },
  68: { name: 'Loja Azul', cost: 300, jobs: 8, income: 35, type: BUILDING_TYPES.COMMERCIAL },
  70: { name: 'Loja Vermelha', cost: 300, jobs: 8, income: 35, type: BUILDING_TYPES.COMMERCIAL },
  71: { name: 'Farmácia', cost: 350, jobs: 10, income: 40, type: BUILDING_TYPES.COMMERCIAL },
  45: { name: 'Escritório Azul', cost: 800, jobs: 40, income: 100, type: BUILDING_TYPES.COMMERCIAL },
  57: { name: 'Torre Comercial', cost: 1500, jobs: 80, income: 200, type: BUILDING_TYPES.COMMERCIAL },

  // --- INDUSTRIAL (Reutilizando alguns que parecem genéricos ou improvisando) ---
  // Como não há indústrias óbvias, vamos usar alguns comerciais "feios" ou repetir
  // Vamos usar o frame 52 (tampa de bueiro/água?) como "bueiro industrial" ou algo assim por enquanto, 
  // ou definir que não temos sprites específicos e usar placeholders se precisar.
  // Mas para ficar bonito, vamos reusar o prédio 56 como "Sede da Indústria" e talvez o 44 (muro) como fábrica baixa.
  // Melhor: Vamos classificar o "Prédio Branco/Azul" (56) como Indústria Limpa/Tecnologia.
  56: { name: 'Tech Office', cost: 1000, jobs: 50, income: 150, pollution: 2, type: BUILDING_TYPES.INDUSTRIAL },

  // --- SERVIÇOS ---
  // Vamos usar o prédio vermelho (64) e alto (65) como serviços públicos
  64: { name: 'Bombeiros', cost: 500, safety: 20, type: BUILDING_TYPES.SERVICE },
  65: { name: 'Hospital', cost: 1200, health: 30, type: BUILDING_TYPES.SERVICE }
}

export function getBuilding(index) {
  return BUILDINGS[index] || { name: `Item ${index}`, cost: 0, type: 'terrain' }
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
