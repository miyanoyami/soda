import { useRef, useState, useEffect } from 'react'
import {
  BG_PRESETS, TEXT_COLOR_PRESETS, TEXT_SHAPE_PRESETS, TEXT_BG_PRESETS, POSITION_PRESETS,
  type BgPresetId, type TextColorId, type TextShapeId, type TextBgId, type PositionId,
} from '../lib/presets'
import { drawBackground, drawBgImage, drawTexts, drawIllust, drawExtras, CANVAS_W, CANVAS_H, type Illust } from '../lib/draw'

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm font-bold text-gray-200">{children}</p>
}

function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly { id: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex flex-wrap gap-1 rounded-lg bg-gray-800 p-1">
        {options.map((o) => (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            className={[
              'rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer',
              value === o.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-100',
            ].join(' ')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const EXTRAS: [string, string][] = [
  ['shinken',   '初見歓迎！'],
  ['tanoshii',  'たのしい！'],
  ['sankagata', '参加型'],
  ['sugoi',     'すごい！！'],
  ['kakkoii',   'かっこいい！！'],
  ['kawaii',    'かわいい！！'],
]

type StyleState = {
  bg: BgPresetId
  color: TextColorId
  shape: TextShapeId
  textBg: TextBgId
  position: PositionId
  extras: Record<string, boolean>
}

const ALL_EXTRAS_OFF = { shinken: false, tanoshii: false, sankagata: false, sugoi: false, kakkoii: false, kawaii: false }
const ALL_EXTRAS_ON  = { shinken: true,  tanoshii: true,  sankagata: true,  sugoi: true,  kakkoii: true,  kawaii: true  }

const STYLE_PRESETS: { id: string; label: string; style: StyleState }[] = [
  { id: 'pop',   label: 'ポップ',   style: { bg: 'solid-lime',   color: 'rainbow', shape: 'wave',    textBg: 'none', position: 'top-left', extras: { ...ALL_EXTRAS_OFF, shinken: true, tanoshii: true } } },
  { id: 'cool',  label: 'クール',   style: { bg: 'solid-cyan',   color: 'blue',    shape: 'solid3d', textBg: 'none', position: 'top',      extras: ALL_EXTRAS_OFF } },
  { id: 'rich',  label: 'リッチ',   style: { bg: 'solid-yellow', color: 'gold',    shape: 'solid3d', textBg: 'none', position: 'top',      extras: ALL_EXTRAS_ON  } },
  { id: 'smart', label: 'スマート', style: { bg: 'solid-white',  color: 'silver',  shape: 'normal',  textBg: 'none', position: 'bottom',   extras: ALL_EXTRAS_OFF } },
]

export default function ThumbnailMaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [title, setTitle]       = useState('マインクラフト')
  const [subtitle, setSubtitle] = useState('とっても楽しいアットホームな配信です(^^)')
  const [bg, setBg]             = useState<BgPresetId>('solid-lime')
  const [color, setColor]       = useState<TextColorId>('rainbow')
  const [shape, setShape]       = useState<TextShapeId>('wave')
  const [textBg, setTextBg]     = useState<TextBgId>('none')
  const [position, setPosition] = useState<PositionId>('top-left')
  const [bgImage, setBgImage]   = useState<HTMLImageElement | null>(null)
  const [bgImageName, setBgImageName] = useState<string | null>(null)
  const [illust, setIllust]     = useState<Illust | null>(null)
  const [illustName, setIllustName] = useState<string | null>(null)
  const [extras, setExtras] = useState<Record<string, boolean>>({
    shinken: true, tanoshii: true, sankagata: false,
    sugoi: false, kakkoii: false, kawaii: false,
  })
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const dragging = useRef(false)
  const dragStart = useRef({ mx: 0, my: 0, ix: 0, iy: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)
    drawBackground(ctx, bg)
    if (bgImage) drawBgImage(ctx, bgImage)
    if (illust) drawIllust(ctx, illust)
    drawTexts(ctx, title, subtitle, color, shape, textBg, position)
    drawExtras(ctx,
      extras.shinken, extras.tanoshii, extras.sankagata,
      extras.sugoi, extras.kakkoii, extras.kawaii,
    )
  }, [bg, bgImage, color, shape, textBg, position, title, subtitle, illust, extras])

  function applyPreset(style: StyleState) {
    setBg(style.bg)
    setColor(style.color)
    setShape(style.shape)
    setTextBg(style.textBg)
    setPosition(style.position)
    setExtras(style.extras)
  }

  function handleBgImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBgImageName(file.name)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => setBgImage(img)
    img.src = url
  }

  function handleIllustUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIllustName(file.name)
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const scale = Math.min((CANVAS_H / img.naturalHeight) * 0.85, 1)
      setIllust({ img, x: CANVAS_W * 0.75, y: CANVAS_H * 0.5, scale })
    }
    img.src = url
  }

  function toCanvas(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = canvasRef.current!.getBoundingClientRect()
    return {
      cx: (e.clientX - rect.left) * (CANVAS_W / rect.width),
      cy: (e.clientY - rect.top)  * (CANVAS_H / rect.height),
    }
  }

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!illust) return
    const { cx, cy } = toCanvas(e)
    const hw = (illust.img.naturalWidth  * illust.scale) / 2
    const hh = (illust.img.naturalHeight * illust.scale) / 2
    if (cx >= illust.x - hw && cx <= illust.x + hw && cy >= illust.y - hh && cy <= illust.y + hh) {
      dragging.current = true
      dragStart.current = { mx: cx, my: cy, ix: illust.x, iy: illust.y }
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging.current || !illust) return
    const { cx, cy } = toCanvas(e)
    setIllust({
      ...illust,
      x: dragStart.current.ix + (cx - dragStart.current.mx),
      y: dragStart.current.iy + (cy - dragStart.current.my),
    })
  }

  function onMouseUp() { dragging.current = false }

  function onWheel(e: React.WheelEvent<HTMLCanvasElement>) {
    if (!illust) return
    e.preventDefault()
    setIllust({ ...illust, scale: Math.max(0.05, illust.scale * (e.deltaY > 0 ? 0.95 : 1.05)) })
  }

  function exportPng() {
    const canvas = canvasRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `kusodasa_${bg}_${color}_${shape}.png`
    a.click()
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-gray-950 p-4 lg:flex-row lg:items-start">

      {/* コントロールパネル */}
      <div className="w-full shrink-0 rounded-2xl bg-gray-900 p-6 lg:w-80" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

        {/* テキスト */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <SectionLabel>タイトル</SectionLabel>
            <textarea
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="タイトル（改行で2行）"
            />
          </div>
          <div>
            <SectionLabel>説明文</SectionLabel>
            <textarea
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              rows={2}
              className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-violet-500 resize-none"
              placeholder="説明文（任意・改行可）"
            />
          </div>
        </div>

        <hr className="border-gray-800" />

        {/* スタイルプリセット */}
        <div>
          <SectionLabel>プリセット</SectionLabel>
          <div className="grid grid-cols-2 gap-2">
            {STYLE_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.style)}
                className="rounded-lg bg-gray-800 py-4 text-sm font-bold text-gray-300 transition hover:bg-gray-700 hover:text-white cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-gray-800" />

        {/* 詳細設定 */}
        <div>
          <button
            onClick={() => setAdvancedOpen(v => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-gray-600 px-4 py-4 text-base font-bold text-gray-200 hover:border-gray-400 hover:text-white cursor-pointer transition"
          >
            <span>詳細設定</span>
            <span>{advancedOpen ? '▲' : '▼'}</span>
          </button>
          {advancedOpen && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <ChipGroup label="背景" options={BG_PRESETS} value={bg} onChange={setBg} />
              <div>
                <SectionLabel>背景画像</SectionLabel>
                <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 px-3 py-2 text-xs text-gray-400 transition hover:border-gray-400 hover:text-gray-200">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 19v-2.5M12 3v13m-4-4l4 4 4-4" />
                  </svg>
                  {bgImageName ?? '画像を選択'}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                </label>
                {bgImage && (
                  <button onClick={() => { setBgImage(null); setBgImageName(null) }} className="mt-1.5 w-full text-center text-[10px] text-gray-500 hover:text-gray-300 cursor-pointer">
                    ✕ 背景画像を削除
                  </button>
                )}
              </div>
              <div className="rounded-xl border border-gray-700 p-3" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p className="text-sm font-bold text-gray-200">タイトル</p>
                <ChipGroup label="位置" options={POSITION_PRESETS} value={position} onChange={setPosition} />
                <div className="rounded-lg border border-gray-700 p-2.5" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <p className="text-xs font-semibold text-gray-400">スタイル</p>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-gray-800 p-1">
                    {TEXT_COLOR_PRESETS.map(o => (
                      <button key={o.id} onClick={() => setColor(o.id)}
                        className={['rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer', color === o.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-100'].join(' ')}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-gray-800 p-1">
                    {TEXT_SHAPE_PRESETS.map(o => (
                      <button key={o.id} onClick={() => setShape(o.id)}
                        className={['rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer', shape === o.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-100'].join(' ')}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1 rounded-lg bg-gray-800 p-1">
                    {TEXT_BG_PRESETS.map(o => (
                      <button key={o.id} onClick={() => setTextBg(o.id)}
                        className={['rounded px-3 py-1.5 text-xs font-bold transition-all cursor-pointer', textBg === o.id ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-100'].join(' ')}>
                        {o.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <SectionLabel>固定装飾</SectionLabel>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {EXTRAS.map(([key, lbl]) => (
                    <label key={key} className="flex cursor-pointer items-center gap-2 text-sm text-gray-300">
                      <input
                        type="checkbox"
                        checked={extras[key]}
                        onChange={e => setExtras(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="accent-violet-500"
                      />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <hr className="border-gray-800" />

        {/* 立ち絵 */}
        <div>
          <SectionLabel>立ち絵</SectionLabel>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-gray-600 px-3 py-3 text-xs text-gray-400 transition hover:border-gray-400 hover:text-gray-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a1.5 1.5 0 001.5 1.5h15A1.5 1.5 0 0021 19v-2.5M12 3v13m-4-4l4 4 4-4" />
            </svg>
            {illustName ?? 'ファイルを選択'}
            <input type="file" accept="image/*" className="hidden" onChange={handleIllustUpload} />
          </label>
          {illust && (
            <p className="mt-1.5 text-center text-[10px] text-gray-500">ドラッグで移動 · ホイールでサイズ変更</p>
          )}
        </div>

        <button
          onClick={exportPng}
          className="w-full rounded-xl bg-violet-500 py-2.5 text-sm font-bold text-white shadow-lg shadow-violet-900/40 transition hover:bg-violet-400 active:scale-95 cursor-pointer"
        >
          PNG 書き出し
        </button>
      </div>

      {/* キャンバス */}
      <div className="min-w-0 flex-1">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{ width: '100%', maxWidth: '960px', aspectRatio: '16/9', height: 'auto', display: 'block', borderRadius: '12px' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        />
      </div>
    </div>
  )
}
