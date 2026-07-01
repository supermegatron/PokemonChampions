import catalogData from '@data/teams/catalog.json'

const STORAGE_KEY = 'pokemon-champions-owned-v1'

export function getDefaultOwnedIds() {
  return [...(catalogData.ownedPokemonIds || [])]
}

export function loadOwnedIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultOwnedIds()
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {
    /* ignore */
  }
  return getDefaultOwnedIds()
}

export function saveOwnedIds(ids) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

export function toggleOwnedId(ids, pokemonId) {
  const set = new Set(ids)
  if (set.has(pokemonId)) set.delete(pokemonId)
  else set.add(pokemonId)
  return [...set].sort()
}

export function isOwnedId(ids, pokemonId) {
  return ids.includes(pokemonId)
}
