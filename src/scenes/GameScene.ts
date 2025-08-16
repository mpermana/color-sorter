import Phaser from 'phaser'
import { canMove, applyMove, isSolved, deepClone } from '../game/logic'
import { generateLevel } from '../game/generator'
import type { State, LevelConfig } from '../game/state'

type TubeView = { x: number; y: number; rect: Phaser.GameObjects.Rectangle, index: number }

export class GameScene extends Phaser.Scene {
  private cfg: LevelConfig = { tubeCount: 8, tubeHeight: 4, colorCount: 6, emptyTubes: 2 }
  private state!: State
  private history: State[] = []
  private tubes: TubeView[] = []
  private selected: number | null = null
  private colors = [0xff5252, 0xffb74d, 0xffee58, 0x69f0ae, 0x40c4ff, 0xb388ff, 0xf48fb1, 0xa7ffeb]

  private tubeW = 56
  private tubeH = 180
  private gapX = 18
  private gapY = 18
  private topOffset = 140

  private moves = 0
  private steps = 20
  private movesText!: Phaser.GameObjects.Text

  create() {
    this.cameras.main.setBackgroundColor('#0e0f13')
    this.add.text(24, 24, 'Color Sort', { color: '#ffffff', fontFamily: 'Arial', fontSize: '24px' })
    this.movesText = this.add.text(24, 56, 'Moves: 0', { color: '#8ecae6', fontFamily: 'Arial', fontSize: '18px' })

    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: '#ffffff', fontFamily: 'Arial', fontSize: '16px' }
    const restart = this.add.text(360, 30, 'Restart', btnStyle).setInteractive({ useHandCursor: true })
    const undo = this.add.text(360, 56, 'Undo', btnStyle).setInteractive({ useHandCursor: true })
    restart.on('pointerup', () => this.newLevel())
    undo.on('pointerup', () => this.undo())

    this.newLevel()
  }

  private layoutTubes() {
    // grid layout: 4 columns x 2 rows (for tubeCount up to ~10)
    this.tubes.forEach(t => t.rect.destroy())
    this.tubes = []

    const cols = 4
    const rows = Math.ceil(this.cfg.tubeCount / cols)
    const startX = (this.game.scale.width - (cols * this.tubeW + (cols - 1) * this.gapX)) / 2 + this.tubeW/2
    const startY = this.topOffset + this.tubeH/2

    for (let i = 0; i < this.cfg.tubeCount; i++) {
      const col = i % cols
      const row = Math.floor(i / cols)
      const x = startX + col * (this.tubeW + this.gapX)
      const y = startY + row * (this.tubeH + this.gapY)
      const rect = this.add.rectangle(x, y, this.tubeW, this.tubeH, 0x000000, 0).setStrokeStyle(2, 0xffffff, 0.25).setInteractive({ useHandCursor: true })
      rect.on('pointerup', () => this.onTubeTap(i))
      this.tubes.push({ x, y, rect, index: i })
    }
  }

  private updateMovesText() {
    this.movesText.setText('Moves: ' + this.moves + ' Steps: ' + this.steps)
  }

  private newLevel() {
    this.moves = 0
    this.updateMovesText()
    this.history = []
    this.state = generateLevel(this.cfg, this.steps)
    this.layoutTubes()
    this.renderState()
  }

  private undo() {
    const prev = this.history.pop()
    if (!prev) return
    this.state = prev
    this.moves = Math.max(0, this.moves - 1)
    this.updateMovesText()
    this.selected = null
    this.renderState()
  }

  private onTubeTap(i: number) {
    if (this.selected === null) {
      // pick source if non-empty
      if (this.state[i].length > 0) {
        this.selected = i
        this.highlight(i, true)
      }
      return
    }
    // try move
    const from = this.selected
    const to = i
    if (canMove(this.state, from, to, this.cfg.tubeHeight)) {
      const prev = deepClone(this.state)
      applyMove(this.state, from, to)
      this.history.push(prev)
      this.moves += 1
      this.updateMovesText()
      this.tweenBall(from, to, () => {
        this.renderState()
        if (isSolved(this.state, this.cfg.tubeHeight)) this.onWin()
      })
    }
    this.highlight(from, false)
    this.selected = null
  }

  private highlight(i: number, on: boolean) {
    const tube = this.tubes[i]
    tube.rect.setStrokeStyle(3, on ? 0x90ee90 : 0xffffff, on ? 0.9 : 0.25)
  }

  private renderState() {
    // Clear balls layer and redraw
    // We'll attach circles to a container for easy cleanup
    if ((this as any).ballsContainer) (this as any).ballsContainer.destroy()
    const cont = this.add.container(0, 0)
    ;(this as any).ballsContainer = cont

    const radius = this.tubeW * 0.35
    const slotH = this.tubeH / this.cfg.tubeHeight
    for (let t = 0; t < this.state.length; t++) {
      const tv = this.tubes[t]
      const tube = this.state[t]
      for (let s = 0; s < tube.length; s++) {
        const colorId = tube[s]
        const cx = tv.x
        // draw from bottom up
        const cy = tv.y + this.tubeH/2 - slotH/2 - s * slotH
        const circle = this.add.circle(cx, cy, radius, this.colors[colorId % this.colors.length]).setStrokeStyle(2, 0x000000, 0.35)
        cont.add(circle)
      }
    }
  }

  private tweenBall(from: number, to: number, onComplete: () => void) {
    // For simplicity, just re-render immediately; add a quick delay for feel
    this.time.delayedCall(80, onComplete)
  }

  private onWin() {
    const txt = this.add.text(this.scale.width/2, 100, 'Level Complete!', { color: '#90ee90', fontFamily: 'Arial', fontSize: '24px' })
    txt.setOrigin(0.5, 0.5)
    this.tweens.add({ targets: txt, y: 120, duration: 250, yoyo: true, repeat: 2 })
  }
}