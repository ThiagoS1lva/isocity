export class IconFactory {
  constructor(scene) {
    this.scene = scene
  }
  
  createIcon(type, x, y, size = 24, color = 0xffffff) {
    const graphics = this.scene.add.graphics()
    graphics.x = x
    graphics.y = y
    
    switch (type) {
      case 'money':
        this.drawMoney(graphics, size, color)
        break
      case 'income':
        this.drawChart(graphics, size, color)
        break
      case 'population':
        this.drawPeople(graphics, size, color)
        break
      case 'happiness':
        this.drawHeart(graphics, size, color)
        break
      case 'pollution':
        this.drawFactory(graphics, size, color)
        break
      case 'pause':
        this.drawPause(graphics, size, color)
        break
      case 'play':
        this.drawPlay(graphics, size, color)
        break
      case 'road':
        this.drawRoad(graphics, size, color)
        break
      case 'warning':
        this.drawWarning(graphics, size, color)
        break
      case 'check':
        this.drawCheck(graphics, size, color)
        break
    }
    
    return graphics
  }
  
  drawMoney(g, size, color) {
    const s = size / 24
    g.lineStyle(2 * s, color)
    g.beginPath()
    g.arc(0, 0, 10 * s, 0, Math.PI * 2)
    g.strokePath()
    g.lineStyle(2.5 * s, color)
    g.beginPath()
    g.moveTo(0, -6 * s)
    g.lineTo(0, 6 * s)
    g.strokePath()
    g.beginPath()
    g.moveTo(-4 * s, -3 * s)
    g.lineTo(4 * s, -3 * s)
    g.strokePath()
    g.beginPath()
    g.moveTo(-4 * s, 3 * s)
    g.lineTo(4 * s, 3 * s)
    g.strokePath()
  }
  
  drawChart(g, size, color) {
    const s = size / 24
    g.lineStyle(2 * s, color)
    g.beginPath()
    g.moveTo(-10 * s, 8 * s)
    g.lineTo(-10 * s, -8 * s)
    g.lineTo(10 * s, -8 * s)
    g.strokePath()
    g.lineStyle(2.5 * s, 0x4ade80)
    g.beginPath()
    g.moveTo(-8 * s, 4 * s)
    g.lineTo(-2 * s, -2 * s)
    g.lineTo(3 * s, 2 * s)
    g.lineTo(8 * s, -6 * s)
    g.strokePath()
  }
  
  drawPeople(g, size, color) {
    const s = size / 24
    g.fillStyle(color)
    g.fillCircle(-5 * s, -5 * s, 4 * s)
    g.fillCircle(5 * s, -5 * s, 4 * s)
    g.fillRoundedRect(-9 * s, 0, 8 * s, 10 * s, 2 * s)
    g.fillRoundedRect(1 * s, 0, 8 * s, 10 * s, 2 * s)
  }
  
  drawHeart(g, size, color) {
    const s = size / 24
    g.fillStyle(color)
    g.beginPath()
    g.moveTo(0, 8 * s)
    g.lineTo(-9 * s, -2 * s)
    g.arc(-5 * s, -5 * s, 5 * s, Math.PI * 0.75, 0, false)
    g.arc(5 * s, -5 * s, 5 * s, Math.PI, Math.PI * 0.25, false)
    g.lineTo(0, 8 * s)
    g.fillPath()
  }
  
  drawFactory(g, size, color) {
    const s = size / 24
    g.fillStyle(color)
    g.fillRect(-8 * s, 2 * s, 16 * s, 8 * s)
    g.fillRect(-6 * s, -6 * s, 4 * s, 8 * s)
    g.fillRect(2 * s, -3 * s, 4 * s, 5 * s)
    g.fillStyle(0x666666)
    g.fillRect(-5 * s, -10 * s, 2 * s, 4 * s)
    g.fillRect(3 * s, -7 * s, 2 * s, 4 * s)
  }
  
  drawPause(g, size, color) {
    const s = size / 24
    g.fillStyle(color)
    g.fillRoundedRect(-7 * s, -8 * s, 5 * s, 16 * s, 1 * s)
    g.fillRoundedRect(2 * s, -8 * s, 5 * s, 16 * s, 1 * s)
  }
  
  drawPlay(g, size, color) {
    const s = size / 24
    g.fillStyle(color)
    g.beginPath()
    g.moveTo(-6 * s, -8 * s)
    g.lineTo(8 * s, 0)
    g.lineTo(-6 * s, 8 * s)
    g.closePath()
    g.fillPath()
  }
  
  drawRoad(g, size, color) {
    const s = size / 24
    g.fillStyle(0x444444)
    g.fillRect(-10 * s, -4 * s, 20 * s, 8 * s)
    g.lineStyle(1.5 * s, 0xffff00)
    g.beginPath()
    g.moveTo(-8 * s, 0)
    g.lineTo(-4 * s, 0)
    g.strokePath()
    g.beginPath()
    g.moveTo(0, 0)
    g.lineTo(4 * s, 0)
    g.strokePath()
  }
  
  drawWarning(g, size, color) {
    const s = size / 24
    g.fillStyle(0xfbbf24)
    g.beginPath()
    g.moveTo(0, -10 * s)
    g.lineTo(10 * s, 8 * s)
    g.lineTo(-10 * s, 8 * s)
    g.closePath()
    g.fillPath()
    g.fillStyle(0x000000)
    g.fillRect(-1.5 * s, -4 * s, 3 * s, 6 * s)
    g.fillCircle(0, 5 * s, 2 * s)
  }
  
  drawCheck(g, size, color) {
    const s = size / 24
    g.lineStyle(3 * s, 0x4ade80)
    g.beginPath()
    g.moveTo(-8 * s, 0)
    g.lineTo(-2 * s, 6 * s)
    g.lineTo(8 * s, -6 * s)
    g.strokePath()
  }
}
