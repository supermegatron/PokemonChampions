const STORAGE_KEY = 'pokemon-champions-owned-v2'

/** Sin lista predefinida: cada usuario marca su caja en la app. */
export function getDefaultOwnedIds() {
  return []
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
