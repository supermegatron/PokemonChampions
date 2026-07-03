const STORAGE_KEY = 'pokemon-champions-owned-v3'

/** Claves antiguas: migrar si la actual está vacía. */
const LEGACY_KEYS = [
  'pokemon-champions-owned-v2',
  'pokemon-champions-owned-v1',
  'pokemon-champions-owned',
]

function normalizeIds(value) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((id) => typeof id === 'string' && id))].sort()
}

function readRaw(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return normalizeIds(parsed)
    if (parsed && Array.isArray(parsed.ids)) return normalizeIds(parsed.ids)
  } catch {
    /* ignore */
  }
  return null
}

function writePayload(ids) {
  const payload = {
    version: 3,
    ids: normalizeIds(ids),
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

/** Sin lista predefinida: cada usuario marca su caja en la app. */
export function getDefaultOwnedIds() {
  return []
}

export function loadOwnedIds() {
  const current = readRaw(STORAGE_KEY)
  if (current?.length) {
    return current
  }

  for (const key of LEGACY_KEYS) {
    const legacy = readRaw(key)
    if (legacy?.length) {
      writePayload(legacy)
      return legacy
    }
  }

  return getDefaultOwnedIds()
}

export function saveOwnedIds(ids) {
  writePayload(ids)
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
