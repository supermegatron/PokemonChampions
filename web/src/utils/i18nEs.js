/** Nombres en castellano (UI). Dataset en inglés; traducciones oficiales en data/M-B/translations/*.json */
import movesData from '@data/translations/moves_es.json'
import abilitiesData from '@data/translations/abilities_es.json'
import itemsData from '@data/translations/items_es.json'

export const MOVE_ES = movesData.labels
export const ABILITY_ES = abilitiesData.labels
export const ITEM_ES = itemsData.labels

export const ROLE_ES = {
  nucleo: 'Núcleo',
  flex: 'Flex',
  senal: 'Señuelo',
}

function labelWithEs(name, map, emptyLabel) {
  if (!name) return emptyLabel
  const es = map[name]
  if (es && es !== name) return `${name} · ${es}`
  return name
}

export function labelAbilityEs(name) {
  return labelWithEs(name, ABILITY_ES, name)
}

export function labelMoveEs(name) {
  return labelWithEs(name, MOVE_ES, '— Vacío —')
}

export function labelItemEs(name) {
  return labelWithEs(name, ITEM_ES, '— Ninguno —')
}

/** Solo castellano (sin prefijo inglés). */
export function moveEsOnly(name) {
  if (!name) return ''
  return MOVE_ES[name] || name
}

export function abilityEsOnly(name) {
  if (!name) return ''
  return ABILITY_ES[name] || name
}

export function itemEsOnly(name) {
  if (!name) return ''
  return ITEM_ES[name] || name
}

/** Coincide nombre en inglés o etiqueta en castellano del dataset. */
export function labelMatchesQuery(enName, query, esMap) {
  const q = (query || '').trim().toLowerCase()
  if (!q) return true
  if (!enName) return false
  if (enName.toLowerCase().includes(q)) return true
  const es = esMap[enName]
  if (es && es.toLowerCase().includes(q)) return true
  return false
}

export function moveNameMatchesQuery(enName, query) {
  return labelMatchesQuery(enName, query, MOVE_ES)
}

export function abilityNameMatchesQuery(enName, query) {
  return labelMatchesQuery(enName, query, ABILITY_ES)
}
