import seedData from '@data/wishlist.json'

const STORAGE_KEY = 'pokemon-champions-wishlist-v4'

export const PRIORITY_ORDER = ['alta', 'media', 'baja']

export const PRIORITY_LABEL = {
  alta: 'Alta',
  media: 'Media',
  baja: 'Baja',
}

const LEGACY_GROUP_TO_TEAM = {
  nieve: 'Nieve · Velo Aurora',
  lluvia: 'Lluvia off-meta',
  arena: 'Arena · Expulsarena',
}

export function parseTeamsInput(input) {
  if (Array.isArray(input)) return normalizeTeams(input)
  if (!input || typeof input !== 'string') return []
  return normalizeTeams(input.split(',').map((s) => s.trim()).filter(Boolean))
}

export function normalizeTeams(teams) {
  const seen = new Set()
  const out = []
  for (const t of teams) {
    const name = String(t).trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(name)
  }
  return out
}

export function collectTeamNames(items) {
  const names = new Set()
  for (const item of items || []) {
    for (const t of item.teams || []) {
      if (t?.trim()) names.add(t.trim())
    }
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'es'))
}

function migrateItem(item) {
  let teams = item.teams
  if (!teams?.length && item.group) {
    if (item.group === 'versatil') {
      teams = []
    } else {
      teams = [LEGACY_GROUP_TO_TEAM[item.group] || item.group]
    }
  }
  return {
    ...item,
    teams: normalizeTeams(teams || []),
    priority: PRIORITY_ORDER.includes(item.priority) ? item.priority : 'media',
  }
}

function seedItems() {
  return (seedData.items || []).map((item) => migrateItem(item))
}

function initialState() {
  return {
    version: seedData.version ?? 1,
    items: seedItems(),
  }
}

function mergeSeedIntoStored(stored) {
  const seed = seedItems()
  const byPokemon = new Map((stored.items || []).map((i) => [i.pokemonId, migrateItem(i)]))
  for (const item of seed) {
    if (!byPokemon.has(item.pokemonId)) {
      byPokemon.set(item.pokemonId, item)
    }
  }
  return {
    version: seedData.version ?? 1,
    items: sortWishlistItems([...byPokemon.values()]),
  }
}

export function loadWishlist() {
  try {
    const seed = initialState()
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seed

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.items)) return seed

    if ((parsed.version ?? 0) < (seedData.version ?? 1)) {
      return mergeSeedIntoStored(parsed)
    }

    return {
      version: parsed.version ?? seed.version,
      items: parsed.items.map(migrateItem),
    }
  } catch {
    return initialState()
  }
}

export function saveWishlist(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function sortWishlistItems(items) {
  return [...items].sort((a, b) => {
    const pa = PRIORITY_ORDER.indexOf(a.priority)
    const pb = PRIORITY_ORDER.indexOf(b.priority)
    if (pa !== pb) return pa - pb
    const ta = (a.teams?.[0] || '').localeCompare(b.teams?.[0] || '', 'es')
    if (ta !== 0) return ta
    return (a.addedAt ?? 0) - (b.addedAt ?? 0)
  })
}

export function addWishlistItem(
  state,
  { pokemonId, name, priority = 'media', teams = [], notes = '' }
) {
  if (state.items.some((i) => i.pokemonId === pokemonId)) return state
  return {
    ...state,
    items: sortWishlistItems([
      ...state.items,
      {
        id: `wish-${pokemonId}-${Date.now()}`,
        pokemonId,
        name,
        priority: PRIORITY_ORDER.includes(priority) ? priority : 'media',
        teams: normalizeTeams(teams),
        notes: notes.trim(),
        addedAt: Date.now(),
      },
    ]),
  }
}

export function updateWishlistItem(state, id, patch) {
  const next = state.items.map((item) => {
    if (item.id !== id) return item
    const updated = { ...item, ...patch }
    if (patch.teams !== undefined) {
      updated.teams = Array.isArray(patch.teams)
        ? normalizeTeams(patch.teams)
        : parseTeamsInput(patch.teams)
    }
    return migrateItem(updated)
  })
  return { ...state, items: sortWishlistItems(next) }
}

export function removeWishlistItem(state, id) {
  return {
    ...state,
    items: state.items.filter((item) => item.id !== id),
  }
}

export function resetWishlistFromSeed() {
  return initialState()
}
