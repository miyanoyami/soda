import type { BgPresetId, TextColorId, TextShapeId, TextBgId, PositionId } from './presets'
import { RAINBOW_COLORS, FONT_FAMILY } from './presets'

export const CANVAS_W = 1920
export const CANVAS_H = 1080
const W = CANVAS_W
const H = CANVAS_H

const TITLE_SIZE = 170
const DESC_SIZE  = 68

// ---- 背景 ---------------------------------------------------------------

export function drawBackground(ctx: CanvasRenderingContext2D, id: BgPresetId) {
  ctx.save()
  switch (id) {
    case 'solid-yellow': ctx.fillStyle = '#ffe000'; break
    case 'solid-lime':   ctx.fillStyle = '#00ff00'; break
    case 'solid-cyan':   ctx.fillStyle = '#00ffff'; break
    case 'solid-white':  ctx.fillStyle = '#ffffff'; break
  }
  ctx.fillRect(0, 0, W, H)
  ctx.restore()
}

export function drawBgImage(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  // アスペクト比を維持しつつcanvas全体をカバー（object-fit: cover）
  const scale = Math.max(W / img.naturalWidth, H / img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h)
}

// ---- サブタイトル帯 -------------------------------------------------------


// ---- 文字色グラデーション -----------------------------------------------

function makeTextFill(
  ctx: CanvasRenderingContext2D,
  color: TextColorId,
  y: number,
  h: number,
  x: number = 0,
  w: number = W,
): string | CanvasGradient {
  switch (color) {
    case 'rainbow': {
      // 横方向グラデーションで赤〜紫を均等に表示
      const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0)
      RAINBOW_COLORS.forEach((c, i) => g.addColorStop(i / (RAINBOW_COLORS.length - 1), c))
      return g
    }
    case 'silver': {
      const g = ctx.createLinearGradient(0, y - h, 0, y)
      g.addColorStop(0,    '#ffffff')
      g.addColorStop(0.1,  '#cccccc')
      g.addColorStop(0.3,  '#ffffff')
      g.addColorStop(0.5,  '#555555')
      g.addColorStop(0.7,  '#eeeeee')
      g.addColorStop(0.85, '#888888')
      g.addColorStop(1,    '#ffffff')
      return g
    }
    case 'gold': {
      const g = ctx.createLinearGradient(0, y - h, 0, y)
      g.addColorStop(0,    '#fffde0')
      g.addColorStop(0.15, '#ffe000')
      g.addColorStop(0.35, '#ffaa00')
      g.addColorStop(0.5,  '#996600')
      g.addColorStop(0.65, '#ffcc00')
      g.addColorStop(0.8,  '#ffee44')
      g.addColorStop(1,    '#fffde0')
      return g
    }
    case 'red':    return '#ff1111'
    case 'blue':   return '#1144ff'
    case 'yellow': return '#ffee00'
    case 'white':  return '#ffffff'
  }
}

function strokeColor(_color: TextColorId): string {
  return '#000000'
}

function solid3dSideColor(color: TextColorId): string {
  switch (color) {
    case 'rainbow': return '#880000'
    case 'silver':  return '#404040'
    case 'gold':    return '#7a4800'
    case 'red':     return '#880000'
    case 'blue':    return '#001888'
    case 'yellow':  return '#886600'
    case 'white':   return '#606060'
  }
}

// ---- 文字背景（値引きシール・ボックス）-----------------------------------

// トゲトゲ吹き出しパス（cx,cy を中心に w×h の楕円形にトゲを付ける）
function spikyBurst(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  rx: number, ry: number,
  spikes: number,
) {
  ctx.beginPath()
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? 1.0 : 0.72
    ctx.lineTo(cx + Math.cos(angle) * rx * r, cy + Math.sin(angle) * ry * r)
  }
  ctx.closePath()
}

function drawTextBgFukidashi(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  textW: number, fontSize: number,
  fillColor: string,
) {
  const rx = textW / 2 + fontSize * 0.8
  const ry = fontSize * 0.9
  ctx.save()
  spikyBurst(ctx, cx, cy - fontSize * 0.3, rx, ry, 14)
  ctx.fillStyle = fillColor
  ctx.fill()
  ctx.restore()
}

function drawTextBgBox(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  textW: number, textH: number, ascent: number,
  fillColor: string,
) {
  const padX = textH * 0.4
  const padY = textH * 0.25
  const bw = textW + padX * 2
  const bh = textH + padY * 2
  const bx = cx - bw / 2
  const by = cy - ascent - padY
  ctx.save()
  ctx.fillStyle = fillColor
  ctx.fillRect(bx, by, bw, bh)
  ctx.restore()
}

// ---- 1文字 / 1単語を実際に描く ------------------------------------------

function paintChar(
  ctx: CanvasRenderingContext2D,
  ch: string,
  x: number,
  y: number,
  fontSize: number,
  color: TextColorId,
  shape: TextShapeId,
  totalCx: number = x,
  totalW: number = 0,
) {
  const effectiveW = totalW > 0 ? totalW : ctx.measureText(ch).width
  const fill = makeTextFill(ctx, color, y, fontSize, totalCx, effectiveW)
  const stroke = strokeColor(color)
  const lw = fontSize * 0.04

  ctx.lineJoin = 'round'

  if (shape === 'solid3d') {
    const depth = Math.round(fontSize * 0.18)
    // 側面色：文字色を暗くした単色
    const sideColor = solid3dSideColor(color)
    // 奥から手前に向かって側面を重ね描き（右下方向に厚み）
    for (let i = depth; i >= 1; i--) {
      ctx.fillStyle = sideColor
      ctx.fillText(ch, x + i, y + i)
    }
    // 正面：縁取り + 正面色
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = lw
    ctx.strokeText(ch, x, y)
    ctx.fillStyle = fill
    ctx.fillText(ch, x, y)
  } else {
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
    ctx.strokeText(ch, x, y)
    ctx.fillStyle = fill
    ctx.shadowColor = 'transparent'
    ctx.fillText(ch, x, y)
  }
}

// ---- 波歪み（ワードアート風）--------------------------------------------
// 文字ごとに水平位置に応じたサインカーブのシアー変形をかける。
// 文字の「位置」ではなく「形状」が歪む。

function drawWave(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  fontSize: number,
  color: TextColorId,
) {
  const amp   = fontSize * 0.12
  const freq  = 1.2
  const widths = Array.from(text).map(ch => ctx.measureText(ch).width)
  const total  = widths.reduce((a, b) => a + b, 0)
  const stroke = strokeColor(color)
  const lw = fontSize * 0.04

  let x = cx - total / 2

  Array.from(text).forEach((ch, i) => {
    const t = (x - (cx - total / 2)) / total
    const shearY = Math.cos(t * Math.PI * freq * 2) * amp * (Math.PI * freq * 2) / total * widths[i]
    const baseY  = cy + Math.sin(t * Math.PI * freq * 2) * amp
    const charCx = x + widths[i] / 2

    ctx.save()
    ctx.translate(charCx, baseY)
    ctx.transform(1, shearY / widths[i], 0, 1, 0, 0)
    // translateで原点が(charCx, baseY)になるため、グラデーションも原点基準で作成
    // rainbow: 全体幅に渡る横グラデーション（translateを考慮してcxからの相対位置）
    // silver/gold: 縦グラデーション（0がベースライン、-fontSizeが上端）
    const fill = makeTextFill(ctx, color, 0, fontSize, cx - charCx, total)
    ctx.lineJoin = 'round'
    ctx.strokeStyle = stroke
    ctx.lineWidth = lw
    ctx.shadowColor = 'rgba(0,0,0,0.45)'
    ctx.shadowBlur = 16
    ctx.shadowOffsetX = 5
    ctx.shadowOffsetY = 5
    ctx.strokeText(ch, 0, 0)
    ctx.fillStyle = fill
    ctx.shadowColor = 'transparent'
    ctx.fillText(ch, 0, 0)
    ctx.restore()
    x += widths[i]
  })
}

// ---- 1行テキスト --------------------------------------------------------

function drawLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  fontSize: number,
  color: TextColorId,
  shape: TextShapeId,
  textBg: TextBgId,
) {
  if (!text) return
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `italic 900 ${fontSize}px ${FONT_FAMILY}`

  const metrics = ctx.measureText(text)
  const textW = metrics.width
  const textH = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent

  // 文字背景を先に描く
  if (textBg === 'fukidashi-red') {
    drawTextBgFukidashi(ctx, cx, cy, textW, fontSize, '#ff0000')
  } else if (textBg === 'fukidashi-yellow') {
    drawTextBgFukidashi(ctx, cx, cy, textW, fontSize, '#ffdd00')
  } else if (textBg === 'box-blue') {
    drawTextBgBox(ctx, cx, cy, textW, textH, metrics.actualBoundingBoxAscent, '#1144ff')
  } else if (textBg === 'box-red') {
    drawTextBgBox(ctx, cx, cy, textW, textH, metrics.actualBoundingBoxAscent, '#ee1111')
  }

  if (shape === 'wave') {
    drawWave(ctx, text, cx, cy, fontSize, color)
  } else {
    paintChar(ctx, text, cx, cy, fontSize, color, shape, cx, textW)
  }

  ctx.restore()
}

// ---- サブタイトル（赤字・黄縁、固定スタイル）---------------------------

function drawSubtitle(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number, cy: number,
  fontSize: number,
) {
  if (!text) return
  const lines = text.split('\n').filter(l => l.length > 0)
  const lineH = fontSize * 1.3
  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.lineJoin = 'round'
  lines.forEach((line, i) => {
    const y = cy + (i - (lines.length - 1) / 2) * lineH
    ctx.strokeStyle = '#ffdd00'
    ctx.lineWidth = fontSize * 0.06
    ctx.strokeText(line, cx, y)
    ctx.fillStyle = '#ff0000'
    ctx.fillText(line, cx, y)
  })
  ctx.restore()
}

// ---- 位置計算 -----------------------------------------------------------

type Layout = {
  cx: number
  cy: number
  rotate: number   // ラジアン
}

function titleLayout(position: PositionId): Layout {
  switch (position) {
    case 'top-left':
      return { cx: W * 0.38 - 50, cy: H * 0.28, rotate: -0.18 }
    case 'top':
      return { cx: W / 2, cy: H * 0.24, rotate: 0 }
    case 'bottom':
      return { cx: W / 2, cy: H * 0.65 + 80, rotate: 0 }
  }
}

// ---- エントリポイント ---------------------------------------------------

export function drawTexts(
  ctx: CanvasRenderingContext2D,
  title: string,
  desc: string,
  color: TextColorId,
  shape: TextShapeId,
  textBg: TextBgId,
  position: PositionId,
) {
  const lines = title.split('\n').filter(l => l.length > 0)
  const lineCount = lines.length
  const lineH = TITLE_SIZE * 1.1
  const { cx, cy, rotate } = titleLayout(position)

  ctx.save()
  if (rotate !== 0) {
    ctx.translate(cx, cy)
    ctx.rotate(rotate)
    lines.forEach((line, i) => {
      const offsetY = (i - (lineCount - 1) / 2) * lineH
      drawLine(ctx, line, 0, offsetY, TITLE_SIZE, color, shape, textBg)
    })
  } else {
    lines.forEach((line, i) => {
      const offsetY = (i - (lineCount - 1) / 2) * lineH
      drawLine(ctx, line, cx, cy + offsetY, TITLE_SIZE, color, shape, textBg)
    })
  }
  ctx.restore()

  if (desc) {
    drawSubtitle(ctx, desc, W / 2, H * 0.91, DESC_SIZE)
  }
}

// ---- 固定装飾要素 -------------------------------------------------------

// 左上「初見歓迎！」トゲトゲ吹き出し
function drawShinkenLabel(ctx: CanvasRenderingContext2D) {
  const cx = W * 0.13
  const cy = H * 0.18 - 80
  const fontSize = 72
  ctx.save()
  ctx.font = `italic 900 ${fontSize}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  const tw = ctx.measureText('初見歓迎！').width
  const rx = tw / 2 + fontSize * 0.9
  const ry = fontSize * 1.05
  spikyBurst(ctx, cx, cy, rx, ry, 16)
  ctx.fillStyle = '#ffdd00'
  ctx.fill()
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#000000'
  ctx.lineWidth = fontSize * 0.05
  ctx.strokeText('初見歓迎！', cx, cy + fontSize * 0.35)
  ctx.fillStyle = '#ff0000'
  ctx.fillText('初見歓迎！', cx, cy + fontSize * 0.35)
  ctx.restore()
}

// 右下 顔アイコン＋「たのしい！」ワードアート
function drawTanoshii(ctx: CanvasRenderingContext2D) {
  const cx = W * 0.88
  const cy = H * 0.76
  const faceR = 130

  ctx.save()

  const faceStroke = '#7a6000'

  // 顔の丸
  ctx.beginPath()
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2)
  ctx.fillStyle = '#f0d96a'
  ctx.fill()
  ctx.strokeStyle = faceStroke
  ctx.lineWidth = 2
  ctx.stroke()

  // 目（左右、正円）
  for (const dx of [-38, 38]) {
    ctx.beginPath()
    ctx.arc(cx + dx, cy - 32, 11, 0, Math.PI * 2)
    ctx.fillStyle = '#5a4400'
    ctx.fill()
  }

  // 口（大きな笑顔弧）
  ctx.beginPath()
  ctx.arc(cx, cy - 40, 120, 0.3 * Math.PI, 0.7 * Math.PI)
  ctx.strokeStyle = faceStroke
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.stroke()

  ctx.restore()

  // 丸角吹き出し＋「たのしい！」（顔の左上）
  const fontSize = 72
  ctx.save()
  ctx.font = `300 ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const text = 'たのしい！'
  const tw = ctx.measureText(text).width
  const padX = fontSize * 0.5
  const padY = fontSize * 0.4
  const bw = tw + padX * 2
  const bh = fontSize + padY * 2
  const bcx = cx - faceR * 0.2
  const bcy = cy - faceR - bh * 0.5 - 40
  const bx = bcx - bw / 2
  const by = bcy - bh / 2
  const r = 28

  // 吹き出し本体（角丸矩形）
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(bx + r, by)
  ctx.lineTo(bx + bw - r, by)
  ctx.quadraticCurveTo(bx + bw, by, bx + bw, by + r)
  ctx.lineTo(bx + bw, by + bh - r)
  ctx.quadraticCurveTo(bx + bw, by + bh, bx + bw - r, by + bh)
  // しっぽ（右下寄り、顔の方向へ）
  ctx.lineTo(bcx + 40, by + bh)
  ctx.lineTo(bcx + 20, by + bh + 60)
  ctx.lineTo(bcx - 20, by + bh)
  ctx.lineTo(bx + r, by + bh)
  ctx.quadraticCurveTo(bx, by + bh, bx, by + bh - r)
  ctx.lineTo(bx, by + r)
  ctx.quadraticCurveTo(bx, by, bx + r, by)
  ctx.closePath()
  ctx.fillStyle = '#ffffff'
  ctx.fill()
  ctx.restore()

  // 「たのしい！」— 通常描画、黒文字・縁取りなし
  const tcy2 = bcy + fontSize * 0.3
  ctx.save()
  ctx.fillStyle = '#000000'
  ctx.fillText(text, bcx, tcy2)
  ctx.restore()

  ctx.restore()
}

// 右上「参加型」虹色・右肩下がり
function drawSankagata(ctx: CanvasRenderingContext2D) {
  const text = '参加型'
  const fontSize = 110
  ctx.save()
  ctx.font = `italic 900 ${fontSize}px ${FONT_FAMILY}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'

  const cx = W * 0.82 + 110
  const cy = H * 0.28 - 130
  const tw = ctx.measureText(text).width

  ctx.translate(cx, cy)
  ctx.rotate(0.2)

  const g = ctx.createLinearGradient(-tw / 2, 0, tw / 2, 0)
  RAINBOW_COLORS.forEach((c, i) => g.addColorStop(i / (RAINBOW_COLORS.length - 1), c))

  ctx.fillStyle = g
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function drawRedLabel(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, fontSize: number, rotate: number = 0, color: string = '#ff0000') {
  ctx.save()
  ctx.font = `bold ${fontSize}px sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.translate(x, y)
  if (rotate !== 0) ctx.rotate(rotate)
  ctx.fillStyle = color
  ctx.fillText(text, 0, 0)
  ctx.restore()
}

function drawDateLabel(ctx: CanvasRenderingContext2D, text: string) {
  const fontSize = 36
  const padX = 22
  const padY = 14
  const bevel = 5

  ctx.save()
  ctx.font = `${fontSize}px system-ui, sans-serif`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'

  const tw = ctx.measureText(text).width
  const bw = tw + padX * 2
  const bh = fontSize + padY * 2
  // 説明文（H*0.91）の上、中央寄せ
  const x = W / 2 - bw / 2
  const y = H * 0.91 - fontSize * 2.2 - bh

  // ボタン本体（オレンジ）
  ctx.fillStyle = '#ff8c00'
  ctx.fillRect(x, y, bw, bh)

  // 上・左エッジ（明るい）
  ctx.fillStyle = '#ffcc66'
  ctx.fillRect(x, y, bw, bevel)           // 上
  ctx.fillRect(x, y, bevel, bh)           // 左

  // 下・右エッジ（暗い）
  ctx.fillStyle = '#994400'
  ctx.fillRect(x, y + bh - bevel, bw, bevel)  // 下
  ctx.fillRect(x + bw - bevel, y, bevel, bh)  // 右

  // 外枠
  ctx.strokeStyle = '#662200'
  ctx.lineWidth = 3
  ctx.strokeRect(x, y, bw, bh)

  // テキスト
  ctx.fillStyle = '#ffffff'
  ctx.fillText(text, x + padX, y + padY + fontSize * 0.82)

  ctx.restore()
}

export function drawExtras(
  ctx: CanvasRenderingContext2D,
  shinken: boolean,
  tanoshii: boolean,
  sankagata: boolean,
  sugoi: boolean,
  kakkoii: boolean,
  kawaii: boolean,
  dateLabel: string | null,
) {
  if (shinken)   drawShinkenLabel(ctx)
  if (tanoshii)  drawTanoshii(ctx)
  if (sankagata) drawSankagata(ctx)
  if (sugoi)     drawRedLabel(ctx, 'すごい！！',    W * 0.18, H * 0.88, 96,  -0.15, '#000000')
  if (kakkoii)   drawRedLabel(ctx, 'かっこいい！！', W * 0.25, H * 0.52, 80,  -0.1,  '#ff0000')
  if (kawaii)    drawRedLabel(ctx, 'かわいい！！',  W * 0.75, H * 0.52, 80,   0.1,  '#ff69b4')
  if (dateLabel) drawDateLabel(ctx, dateLabel)
}

// ---- 立ち絵 -------------------------------------------------------------

export type Illust = {
  img: HTMLImageElement
  x: number
  y: number
  scale: number
}

export function drawIllust(ctx: CanvasRenderingContext2D, illust: Illust) {
  const { img, x, y, scale } = illust
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  ctx.drawImage(img, x - w / 2, y - h / 2, w, h)
}
