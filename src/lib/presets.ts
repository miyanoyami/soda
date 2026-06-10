export const BG_PRESETS = [
  { id: 'solid-yellow', label: '黄色' },
  { id: 'solid-lime',   label: '黄緑' },
  { id: 'solid-cyan',   label: '水色' },
  { id: 'solid-white',  label: '白' },
] as const
export type BgPresetId = typeof BG_PRESETS[number]['id']

export const TEXT_COLOR_PRESETS = [
  { id: 'rainbow', label: '虹' },
  { id: 'silver',  label: '銀' },
  { id: 'gold',    label: '金' },
  { id: 'red',     label: '赤' },
  { id: 'blue',    label: '青' },
  { id: 'yellow',  label: '黄' },
  { id: 'white',   label: '白' },
] as const
export type TextColorId = typeof TEXT_COLOR_PRESETS[number]['id']

export const TEXT_SHAPE_PRESETS = [
  { id: 'normal', label: '通常' },
  { id: 'wave',   label: '波' },
  { id: 'solid3d', label: '立体' },
] as const
export type TextShapeId = typeof TEXT_SHAPE_PRESETS[number]['id']

export const TEXT_BG_PRESETS = [
  { id: 'none',             label: 'なし' },
  { id: 'fukidashi-red',    label: '吹き出し（赤）' },
  { id: 'fukidashi-yellow', label: '吹き出し（黄）' },
  { id: 'box-blue',         label: '四角（青）' },
  { id: 'box-red',          label: '四角（赤）' },
] as const
export type TextBgId = typeof TEXT_BG_PRESETS[number]['id']

export const POSITION_PRESETS = [
  { id: 'top-left', label: '左上（傾き）' },
  { id: 'top',      label: '上（中央）' },
  { id: 'bottom',   label: '下（中央）' },
] as const
export type PositionId = typeof POSITION_PRESETS[number]['id']

export const FONT_FAMILY = '"Impact", "Arial Black", sans-serif'
export const RAINBOW_COLORS = ['#ff0000', '#ff6600', '#ffee00', '#00ff00', '#00aaff', '#cc00ff', '#ff00cc']
