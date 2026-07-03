import moveIndexData from '@data/move-index.json'

const MOVE_META = moveIndexData.moves || {}

const CATEGORY_ES = {
  Physical: 'Físico',
  Special: 'Especial',
  Status: 'Estado',
}

export function getMoveMeta(moveName) {
  if (!moveName) return null
  const direct = MOVE_META[moveName]
  if (direct) return direct
  const hit = Object.entries(MOVE_META).find(([k]) => k.toLowerCase() === moveName.toLowerCase())
  return hit ? hit[1] : null
}

export function getMoveCategory(move, moveName = move?.name) {
  const meta = getMoveMeta(moveName)
  if (meta?.category) return meta.category
  if (move?.power == null) return 'Status'
  const desc = (move?.description || '').toLowerCase()
  if (desc.includes('physical move')) return 'Physical'
  if (desc.includes('special move')) return 'Special'
  return move?.power > 0 ? 'Physical' : 'Status'
}

export function labelMoveCategory(category) {
  return CATEGORY_ES[category] || category || '—'
}

export function classifyMove(move) {
  const category = getMoveCategory(move, move?.name)
  const meta = getMoveMeta(move?.name)
  return {
    type: meta?.type || null,
    category,
    categoryEs: labelMoveCategory(category),
  }
}

export const MOVE_TYPES = [
  'Normal',
  'Fire',
  'Water',
  'Electric',
  'Grass',
  'Ice',
  'Fighting',
  'Poison',
  'Ground',
  'Flying',
  'Psychic',
  'Bug',
  'Rock',
  'Ghost',
  'Dragon',
  'Dark',
  'Steel',
  'Fairy',
]

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'Physical', label: 'Físico' },
  { id: 'Special', label: 'Especial' },
  { id: 'Status', label: 'Estado' },
]

export function filterMoves(moves, { search = '', type = '', category = 'all' }) {
  const q = search.trim().toLowerCase()
  return moves.filter((move) => {
    const info = classifyMove(move)
    if (category !== 'all' && info.category !== category) return false
    if (type && info.type !== type) return false
    if (!q) return true
    const name = move.name.toLowerCase()
    return name.includes(q) || info.type?.toLowerCase().includes(q)
  })
}
