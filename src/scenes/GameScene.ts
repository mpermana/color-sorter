import Phaser from 'phaser'
import { canMove, applyMove, isSolved, deepClone } from '../game/logic'
import { generateLevel } from '../game/generator'
import { ensureAdScriptLoaded } from '../game/ad'
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
  private gapY = 18 + 100
  private topOffset = 140

  private moves = 0
  private movesText!: Phaser.GameObjects.Text
  private fsBtn!: Phaser.GameObjects.Text

  private winOverlay!: Phaser.GameObjects.Rectangle;
  private winDialog!: Phaser.GameObjects.Container;

  private adDom?: Phaser.GameObjects.DOMElement;

  init(data: { cfg?: LevelConfig }) {
    if (data?.cfg) this.cfg = data.cfg;
  }

  create() {
    this.cameras.main.setBackgroundColor('#0e0f13')
    this.add.text(24, 24, 'Color Sort', { color: '#ffffff', fontFamily: 'Arial', fontSize: '24px' })
    this.movesText = this.add.text(24, 56, 'Moves: 0', { color: '#8ecae6', fontFamily: 'Arial', fontSize: '18px' })

    const btnStyle: Phaser.Types.GameObjects.Text.TextStyle = { color: '#ffffff', fontFamily: 'Arial', fontSize: '16px' }
    const restart = this.add.text(360, 30, 'Restart', btnStyle).setInteractive({ useHandCursor: true })
    const undo = this.add.text(360, 56, 'Undo', btnStyle).setInteractive({ useHandCursor: true })
    const complete = this.add.text(360, 82, 'Complete', btnStyle).setInteractive({ useHandCursor: true })
    restart.on('pointerup', () => this.newLevel())
    undo.on('pointerup', () => this.undo())
    complete.on('pointerup', () => this.complete())
    this.scale.on('resize', this.onResize, this);

    // Fullscreen API
    const fs = this.fsBtn = this.add.text(this.scale.width - 24, 24, '⤢ Fullscreen', {
      color: '#ffffff', fontFamily: 'Arial', fontSize: '32px'
    }).setOrigin(1, 0).setInteractive({ useHandCursor: true });

    fs.on('pointerup', () => {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    });

    // nice ball texture
    this.buildBallTextures();

    this.newLevel()

    this.createWinDialog()
  }

  private createWinDialog() {
    const cam = this.cameras.main;
    const cx = cam.width / 2;
    const cy = cam.height / 2;

    this.winOverlay = this.add.rectangle(0, 0, cam.width, cam.height, 0x000000, 0.5)
      .setOrigin(0).setDepth(1000).setVisible(false).setInteractive();

    const panelW = Math.min(420, cam.width - 40);
    const panelH = 280;
    const panel = this.add.rectangle(cx, cy, panelW, panelH, 0xffffff, 1)
      .setStrokeStyle(2, 0x222222).setDepth(1001);

    const title = this.add.text(cx, cy - 85, 'Level Complete!', {
      fontFamily: 'Arial', fontSize: '32px', color: '#222', fontStyle: 'bold', align: 'center',
    }).setOrigin(0.5).setDepth(1001);

    // --- DOM Ad slot (AdSense example) ---
    const adW = panelW - 32;
    const adH = 60;

    // Ensure script is loaded (or load in index.html)
    ensureAdScriptLoaded('ca-pub-9145060996594620'); // <-- your client id

    const adHtml = `
    <ins class="adsbygoogle"
         style="display:inline-block;width:${adW}px;height:${adH}px"
         data-ad-client="ca-pub-9145060996594620"
         data-ad-slot="YYYYYYYYYY"></ins>
  `;

    this.adDom = this.add.dom(cx, cy - 10).createFromHTML(adHtml);
    this.adDom.setDepth(1001);

    // Button
    const btn = this.add.rectangle(cx, cy + 70, 170, 46, 0x1677ff, 1)
      .setDepth(1001).setInteractive({ useHandCursor: true });
    const btnText = this.add.text(btn.x, btn.y, 'New Game', {
      fontFamily: 'Arial', fontSize: '20px', color: '#fff',
    }).setOrigin(0.5).setDepth(1001);

    btn.on('pointerover', () => btn.setFillStyle(0x3c8dff));
    btn.on('pointerout', () => btn.setFillStyle(0x1677ff));
    btn.on('pointerdown', () => btn.setAlpha(0.85));
    btn.on('pointerup', () => { btn.setAlpha(1); this.startNewGame(); });

    this.winDialog = this.add.container(0, 0, [panel, title, this.adDom, btn, btnText])
      .setDepth(1001).setVisible(false).setAlpha(0).setScale(0.95);
  }


  private showLevelCompleteDialog() {
    this.winOverlay.setVisible(true);
    this.winDialog.setVisible(true);

    // Sweet little pop-in
    this.tweens.add({
      targets: this.winDialog,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Quad.easeOut',
    });

    // Ask AdSense to render (safe to try/catch)
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { }
  }

  private hideLevelCompleteDialog() {
    this.winOverlay.setVisible(false);
    this.winDialog.setVisible(false);
    this.winDialog.setAlpha(0).setScale(0.95);
  }

  private startNewGame() {
    this.hideLevelCompleteDialog();
    // If your create() regenerates the level, just restart:
    this.scene.restart({ cfg: this.cfg });

    // (Alternative if you don’t want a full restart:)
    // this.state = generateLevel(this.cfg);
    // this.history.length = 0;
    // this.selected = null;
    // this.redrawFromState(); // implement to refresh tube graphics
  }

  private onResize(gameSize: Phaser.Structs.Size) {
    const { width, height } = gameSize;
    this.cameras.resize(width, height);
    this.fsBtn.setPosition(width - 24, 24);
    this.layoutTubes();
    this.renderState();
  }

  private layoutTubes() {
    // grid layout: 4 columns x 2 rows (for tubeCount up to ~10)
    this.tubes.forEach(t => t.rect.destroy())
    this.tubes = []

    const cols = 4
    const rows = Math.ceil(this.cfg.tubeCount / cols)
    const startX = (this.game.scale.width - (cols * this.tubeW + (cols - 1) * this.gapX)) / 2 + this.tubeW / 2
    const startY = this.topOffset + this.tubeH / 2

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

  private newLevel() {
    this.moves = 0
    this.movesText.setText('Moves: 0')
    this.history = []
    this.selected = null
    this.state = generateLevel(this.cfg, 300)
    this.layoutTubes()
    this.renderState()
  }

  private undo() {
    const prev = this.history.pop()
    if (!prev) return
    this.state = prev
    this.moves = Math.max(0, this.moves - 1)
    this.movesText.setText('Moves: ' + this.moves)
    this.selected = null
    this.renderState()
  }

  private complete() {
    this.moves = 0
    this.movesText.setText('Moves: 0')
    this.history = []
    this.selected = null
    this.state = generateLevel(this.cfg, 0)
    console.log('this.state')
    this.layoutTubes()
    this.renderState()
    this.onWin();
  }

  private onTubeTap(i: number) {
    if (this.selected === null) {
      // pick source if non-empty
      if (this.state[i].length > 0) {
        this.selected = i
        this.highlight(i, true)
        this.renderState() // show hover
      }
      return
    }
    // try move
    const from = this.selected
    const to = i
    const valid = canMove(this.state, from, to, this.cfg.tubeHeight)
    if (valid) {
      const prev = deepClone(this.state)
      applyMove(this.state, from, to)
      this.history.push(prev)
      this.moves += 1
      this.movesText.setText('Moves: ' + this.moves)
      this.highlight(from, false)
      this.selected = null
      this.renderState() // remove hover and update
      this.tweenBall(from, to, () => {
        this.renderState()
        if (isSolved(this.state, this.cfg.tubeHeight)) this.onWin()
      })
    } else {
      this.highlight(from, false)
      this.selected = null
      this.renderState() // remove hover
    }
  }

  private highlight(i: number, on: boolean) {
    const tube = this.tubes[i]
    tube.rect.setStrokeStyle(3, on ? 0x90ee90 : 0xffffff, on ? 0.9 : 0.25)
  }

  private renderState() {
    // Clear previous layers
    if ((this as any).ballsContainer) (this as any).ballsContainer.destroy()
    if ((this as any).selectedOverlay) (this as any).selectedOverlay.destroy()

    const cont = this.add.container(0, 0)
      ; (this as any).ballsContainer = cont

    const radius = this.tubeW * 0.35
    const slotH = this.tubeH / this.cfg.tubeHeight

    // Draw balls in tubes, skipping the selected tube's top ball
    for (let t = 0; t < this.state.length; t++) {
      const tv = this.tubes[t]
      const tube = this.state[t]
      for (let s = 0; s < tube.length; s++) {
        const isTopOfSelected = (this.selected === t) && (s === tube.length - 1)
        if (isTopOfSelected) continue

        const colorId = tube[s]
        const cx = tv.x
        const cy = tv.y + this.tubeH / 2 - slotH / 2 - s * slotH  // bottom-up
        function addCircle(that: any) {
          // soft shadow
          const shadow = that.add.image(cx, cy + radius * 0.6, 'ball-shadow')
            .setDisplaySize(radius * 2.2, radius * 0.9)
            .setAlpha(0.5);
          cont.add(shadow);

          // glossy ball
          const img = that.add.image(cx, cy, that.ballKey(colorId))
            .setDisplaySize(radius * 2, radius * 2);
          cont.add(img);
        }
        addCircle(this)
      }
    }

    // Draw the selected top ball hovering above its tube
    if (this.selected !== null) {
      const tIdx = this.selected
      const tube = this.state[tIdx]
      if (tube.length > 0) {
        const colorId = tube[tube.length - 1]
        const tv = this.tubes[tIdx]
        const hoverY = tv.y - this.tubeH / 2 - radius - 12
        // shadow under hover
        const hShadow = this.add.image(tv.x, hoverY + radius * 0.8, 'ball-shadow')
          .setDisplaySize(radius * 2.2, radius * 0.9)
          .setAlpha(0.45);
        cont.add(hShadow);

        const hover = this.add.image(tv.x, hoverY, this.ballKey(colorId))
          .setDisplaySize(radius * 2, radius * 2);
        cont.add(hover);

        // subtle breathing/bob
        this.tweens.add({ targets: hover, y: hoverY - 4, duration: 420, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        (this as any).selectedOverlay = hover;
      }
    }
  }

  private tweenBall(from: number, to: number, onComplete: () => void) {
    // Placeholder for future animation; currently a slight delay
    this.time.delayedCall(80, onComplete)
  }

  private onWin() {
    // const txt = this.add.text(this.scale.width / 2, 100, 'Level Complete!', { color: '#90ee90', fontFamily: 'Arial', fontSize: '24px' })
    // txt.setOrigin(0.5, 0.5)
    // this.tweens.add({ targets: txt, y: 120, duration: 250, yoyo: true, repeat: 2 })

    // Small delay so the final move animation finishes
    this.time.delayedCall(250, () => this.showLevelCompleteDialog());
  }

  private ballKey(i: number) { return `ball-${i}`; }

  private buildBallTextures() {
    const size = 128; // base texture size (scales cleanly)
    for (let i = 0; i < this.colors.length; i++) {
      const key = this.ballKey(i);
      if (this.textures.exists(key)) continue;

      const tex = this.textures.createCanvas(key, size, size);
      const ctx = tex?.getContext() as CanvasRenderingContext2D;
      const cx = size / 2;
      const cy = size / 2;
      const r = size / 2 - 2;

      // convert 0xRRGGBB -> rgb
      const col = Phaser.Display.Color.IntegerToColor(this.colors[i]);
      const base = `rgb(${col.red},${col.green},${col.blue})`;
      const dark = `rgb(${(col.red * 0.55) | 0},${(col.green * 0.55) | 0},${(col.blue * 0.55) | 0})`;

      // main radial gradient (light top-left → darker bottom-right)
      const grad = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.1, cx, cy, r);
      grad.addColorStop(0, base);
      grad.addColorStop(1, dark);

      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();

      // subtle rim highlight
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r - 1, 0, Math.PI * 2);
      ctx.stroke();

      // specular highlight blob
      const hg = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.35, 0, cx - r * 0.35, cy - r * 0.35, r * 0.6);
      hg.addColorStop(0, 'rgba(255,255,255,0.9)');
      hg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(cx - r * 0.25, cy - r * 0.30, r * 0.6, 0, Math.PI * 2);
      ctx.fill();

      tex.refresh();
    }

    // soft drop shadow (reused for all balls)
    if (!this.textures.exists('ball-shadow')) {
      const w = 160, h = 80;
      const tex = this.textures.createCanvas('ball-shadow', w, h);
      const ctx = tex.getContext() as CanvasRenderingContext2D;
      const g = ctx.createRadialGradient(w / 2, h / 2, 5, w / 2, h / 2, w / 2);
      g.addColorStop(0, 'rgba(0,0,0,0.35)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      tex.refresh();
    }
  }

}