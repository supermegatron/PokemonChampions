export const EV_TOTAL_MAX = 66
export const EV_STAT_MAX = 32

export const STAT_META = [
  { key: 'hp', label: 'PS', color: '#ef4444' },
  { key: 'atk', label: 'Ataque', color: '#f97316' },
  { key: 'def', label: 'Defensa', color: '#eab308' },
  { key: 'spa', label: 'At. Esp.', color: '#3b82f6' },
  { key: 'spd', label: 'Def. Esp.', color: '#8b5cf6' },
  { key: 'spe', label: 'Velocidad', color: '#ec4899' },
]

export const STAT_BAR_MAX = {
  hp: 235,
  atk: 210,
  def: 210,
  spa: 240,
  spd: 200,
  spe: 220,
}

export const STAT_KEYS = STAT_META.map((s) => s.key)

export function emptyEvs() {
  return { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }
}

export function normalizeEvs(evs) {
  const base = emptyEvs()
  if (!evs) return base
  for (const key of STAT_KEYS) {
    base[key] = Math.min(EV_STAT_MAX, Math.max(0, Number(evs[key]) || 0))
  }
  return base
}

export function evTotal(evs) {
  return STAT_KEYS.reduce((sum, key) => sum + (evs[key] || 0), 0)
}

export function canSetEv(evs, stat, value) {
  const v = Math.min(EV_STAT_MAX, Math.max(0, value))
  const delta = v - (evs[stat] || 0)
  if (delta > 0 && evTotal(evs) + delta > EV_TOTAL_MAX) return false
  return true
}

export function setEv(evs, stat, value) {
  const v = Math.min(EV_STAT_MAX, Math.max(0, value))
  const next = { ...evs, [stat]: v }
  while (evTotal(next) > EV_TOTAL_MAX) {
    next[stat] -= 1
    if (next[stat] < 0) break
  }
  return normalizeEvs(next)
}

export function getNatureMods(natureName, natureList) {
  const nature = natureList.find((n) => n.name === natureName)
  if (!nature?.plus || !nature?.minus) return { plus: null, minus: null, mods: {} }
  return {
    plus: nature.plus,
    minus: nature.minus,
    mods: { [nature.plus]: 1.1, [nature.minus]: 0.9 },
  }
}

export function calcEffectiveStats(baseStats, evs, natureName, natureList) {
  const normalized = normalizeEvs(evs)
  const { mods } = getNatureMods(natureName, natureList)
  const out = {}
  for (const key of STAT_KEYS) {
    let value = (baseStats?.[key] || 0) + (normalized[key] || 0)
    const mod = mods[key]
    if (mod) value = Math.floor(value * mod)
    out[key] = value
  }
  return { values: out, evs: normalized }
}
