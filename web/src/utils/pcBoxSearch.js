import { abilityNameMatchesQuery, moveNameMatchesQuery } from './i18nEs'

function norm(q) {
  return (q || '').trim().toLowerCase()
}

function normStatToken(s) {
  return (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\./g, '')
    .replace(/\s+/g, ' ')
}

const STAT_ALIASES = {
  hp: ['hp', 'ps', 'vida'],
  atk: ['atk', 'ataque', 'attack'],
  def: ['def', 'defensa', 'defense'],
  spa: [
    'spa',
    'spatk',
    'sp atk',
    'sp at',
    'at esp',
    'atk esp',
    'esp atk',
    'esp at',
    'ataque especial',
    'at es',
  ],
  spd: ['spd', 'spdef', 'sp def', 'def esp', 'def es', 'defensa especial'],
  spe: ['spe', 'speed', 'vel', 'velo', 'velocidad'],
  bst: ['bst', 'total', 'base total', 'suma'],
}

const STAT_KEY_BY_ALIAS = Object.fromEntries(
  Object.entries(STAT_ALIASES).flatMap(([key, aliases]) =>
    [key, ...aliases].map((alias) => [normStatToken(alias), key])
  )
)

function resolveStatKey(token) {
  const n = normStatToken(token)
  if (!n) return null
  if (STAT_KEY_BY_ALIAS[n]) return STAT_KEY_BY_ALIAS[n]
  for (const [alias, key] of Object.entries(STAT_KEY_BY_ALIAS)) {
    if (alias.length >= 3 && (n.includes(alias) || alias.includes(n))) return key
  }
  return null
}

function normalizeStatClause(clause) {
  return (clause || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/\+\s*de/g, '>')
    .replace(/\b(mas|más)\s+de\b/g, '>')
    .replace(/\b(menor|menos)\s+de\b/g, '<')
    .replace(/\b(mayor|más)\s+que\b/g, '>')
    .replace(/\bde\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** @returns {{ stat: string, op: string, threshold: number } | null} */
export function parseStatFilterClause(clause) {
  const c = normalizeStatClause(clause)
  if (!c) return null

  const op = '(>=|<=|>|<|=|≥|≤)'
  let m = c.match(new RegExp(`^(.+?)\\s*${op}\\s*(\\d+)\\s*$`))
  if (m) {
    const stat = resolveStatKey(m[1])
    if (stat) return { stat, op: m[2], threshold: Number(m[3]) }
  }

  m = c.match(new RegExp(`^${op}\\s*(\\d+)\\s+(.+)$`))
  if (m) {
    const stat = resolveStatKey(m[3])
    if (stat) return { stat, op: m[1], threshold: Number(m[2]) }
  }

  return null
}

/** @returns {{ stat: string, op: string, threshold: number }[]} */
export function parseStatFilters(query) {
  const q = (query || '').trim()
  if (!q) return []
  return q
    .split(/[,;]+/)
    .map((part) => parseStatFilterClause(part))
    .filter(Boolean)
}

export function getPokemonStatValue(pokemon, statKey) {
  const stats = pokemon?.stats
  if (!stats) return null
  const raw = stats[statKey]
  if (raw != null && raw > 0) return raw
  if (statKey === 'spe' && stats.bst) {
    const sum = ['hp', 'atk', 'def', 'spa', 'spd'].reduce(
      (acc, key) => acc + (stats[key] ?? 0),
      0
    )
    return stats.bst - sum
  }
  return raw ?? null
}

function compareStat(value, op, threshold) {
  switch (op) {
    case '>':
      return value > threshold
    case '>=':
    case '≥':
      return value >= threshold
    case '<':
      return value < threshold
    case '<=':
    case '≤':
      return value <= threshold
    case '=':
      return value === threshold
    default:
      return true
  }
}

export function pokemonMatchesStatFilters(pokemon, filters) {
  if (!filters?.length) return true
  return filters.every((filter) => {
    const value = getPokemonStatValue(pokemon, filter.stat)
    if (value == null) return false
    return compareStat(value, filter.op, filter.threshold)
  })
}

/** Partes de una búsqueda múltiple separada por coma o punto y coma. */
function splitListQuery(query) {
  const q = (query || '').trim()
  if (!q) return []
  return q
    .split(/[,;]+/)
    .map((part) => part.trim())
    .filter(Boolean)
}

export function pokemonHasMove(pokemon, moveQuery) {
  const parts = splitListQuery(moveQuery)
  if (!parts.length) return true
  return parts.every((part) =>
    (pokemon.moves || []).some((m) => moveNameMatchesQuery(m.name, part))
  )
}

export function pokemonHasAbility(pokemon, abilityQuery, { hiddenOnly = false } = {}) {
  const parts = splitListQuery(abilityQuery)
  if (!parts.length) return true
  return parts.every((part) =>
    (pokemon.abilities || []).some((a) => {
      if (hiddenOnly && !a.hidden) return false
      return abilityNameMatchesQuery(a.name, part)
    })
  )
}

export function filterPcBoxPokemon(
  pokemonList,
  {
    nameQuery = '',
    typeFilter = '',
    ownedFilter = '',
    moveQuery = '',
    abilityQuery = '',
    statQuery = '',
    hiddenAbilityOnly = false,
    ownedIds = [],
    isOwnedId,
  }
) {
  const q = norm(nameQuery)
  const statFilters = parseStatFilters(statQuery)
  return pokemonList.filter((p) => {
    if (typeFilter && !p.types.includes(typeFilter)) return false
    if (ownedFilter === 'owned' && !isOwnedId(ownedIds, p.id)) return false
    if (ownedFilter === 'not-owned' && isOwnedId(ownedIds, p.id)) return false
    if (q && !p.name.toLowerCase().includes(q) && !p.id.includes(q)) return false
    if (!pokemonHasMove(p, moveQuery)) return false
    if (!pokemonHasAbility(p, abilityQuery, { hiddenOnly: hiddenAbilityOnly })) return false
    if (!pokemonMatchesStatFilters(p, statFilters)) return false
    return true
  })
}

export function buildPcSearchVocab(pokemonList) {
  const moves = new Set()
  const abilities = new Set()
  for (const p of pokemonList) {
    for (const m of p.moves || []) moves.add(m.name)
    for (const a of p.abilities || []) abilities.add(a.name)
  }
  return {
    moves: [...moves].sort((a, b) => a.localeCompare(b, 'en')),
    abilities: [...abilities].sort((a, b) => a.localeCompare(b, 'en')),
  }
}

export function hasAdvancedFilters({ moveQuery, abilityQuery, statQuery, hiddenAbilityOnly }) {
  return Boolean(norm(moveQuery) || norm(abilityQuery) || norm(statQuery) || hiddenAbilityOnly)
}
