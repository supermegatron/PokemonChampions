import catalogData from '@data/teams/catalog.json'
import descriptionsData from '@data/teams/descriptions.json'

export { catalogData, descriptionsData }

export function normalizeSlot(slot) {
  if (!slot) return null
  return {
    pokemonId: slot.pokemonId,
    ability: slot.ability || '',
    item: slot.item || '',
    nature: slot.nature || '',
    moves: [...(slot.moves || [])],
    role: slot.role || '',
    roleLabel: slot.roleLabel || '',
    owned: slot.owned ?? false,
  }
}

export function applyDescriptions(team, descriptions = descriptionsData) {
  const text = descriptions[team.id] || {}
  return {
    ...team,
    description: text.description ?? '',
    recruitHint: text.recruitHint ?? '',
    bringHint: text.bringHint ?? '',
    notes: text.notes ?? '',
    cover: (team.tags || []).includes('cover'),
    fromCatalog: true,
  }
}

export function teamFromCatalogEntry(entry, descriptions = descriptionsData) {
  const base = {
    id: entry.id,
    name: entry.name,
    tags: entry.tags || [],
    slots: entry.slots.map(normalizeSlot),
    metaEdited: false,
  }
  return applyDescriptions(base, descriptions)
}

export function buildCatalogTeams() {
  return catalogData.teams.map((t) => teamFromCatalogEntry(t))
}

export function getOwnedPokemonIds() {
  return catalogData.ownedPokemonIds || []
}

export function getSeedVersion() {
  return catalogData.seedVersion ?? 1
}

export function getCatalogTeamIds() {
  return new Set(catalogData.teams.map((t) => t.id))
}

export function createEmptyTeam(name = 'Nuevo equipo') {
  const id = `team-user-${Date.now()}`
  return {
    id,
    name,
    tags: [],
    description: '',
    recruitHint: '',
    bringHint: '',
    notes: '',
    cover: false,
    fromCatalog: false,
    metaEdited: true,
    slots: Array.from({ length: 6 }, () => null),
  }
}

/** Merge plantillas del repo: añade equipos que falten; opcionalmente refresca sets si sube seedVersion. */
export function mergeCatalogIntoStored(stored, { refreshCatalog = false } = {}) {
  const catalogTeams = buildCatalogTeams()
  const catalogIds = getCatalogTeamIds()
  const byId = new Map((stored.teams || []).map((t) => [t.id, t]))

  for (const catalogTeam of catalogTeams) {
    const existing = byId.get(catalogTeam.id)
    if (!existing) {
      byId.set(catalogTeam.id, catalogTeam)
    } else if (refreshCatalog) {
      byId.set(catalogTeam.id, {
        ...catalogTeam,
        name: existing.metaEdited ? existing.name : catalogTeam.name,
        description: existing.metaEdited ? existing.description : catalogTeam.description,
        recruitHint: existing.metaEdited ? existing.recruitHint : catalogTeam.recruitHint,
        bringHint: existing.metaEdited ? existing.bringHint : catalogTeam.bringHint,
        notes: existing.metaEdited ? existing.notes : catalogTeam.notes,
        metaEdited: existing.metaEdited ?? false,
      })
    }
  }

  const customTeams = (stored.teams || []).filter((t) => !catalogIds.has(t.id))
  const catalogOrdered = catalogTeams.map((t) => byId.get(t.id) || t)
  const teams = [...catalogOrdered, ...customTeams]

  const activeTeamId = teams.some((t) => t.id === stored.activeTeamId)
    ? stored.activeTeamId
    : teams[0]?.id

  return {
    seedVersion: getSeedVersion(),
    activeTeamId,
    teams,
  }
}

/** Restaura roster + textos de plantillas del repo (equipos de catálogo). Conserva equipos custom. */
export function resetCatalogTeams(stored) {
  const catalogTeams = buildCatalogTeams()
  const catalogIds = getCatalogTeamIds()
  const customTeams = (stored?.teams || []).filter((t) => !catalogIds.has(t.id))
  const activeTeamId =
    catalogTeams[0]?.id && !customTeams.some((t) => t.id === stored?.activeTeamId)
      ? stored?.activeTeamId && catalogIds.has(stored.activeTeamId)
        ? stored.activeTeamId
        : catalogTeams[0].id
      : catalogTeams[0]?.id

  return {
    seedVersion: getSeedVersion(),
    activeTeamId: activeTeamId || customTeams[0]?.id,
    teams: [...catalogTeams, ...customTeams],
  }
}

/** Actualiza solo textos desde descriptions.json para equipos de catálogo no editados en UI. */
export function syncDescriptionsFromRepo(stored) {
  const catalogIds = getCatalogTeamIds()
  return {
    ...stored,
    seedVersion: getSeedVersion(),
    teams: stored.teams.map((t) => {
      if (!catalogIds.has(t.id) || t.metaEdited) return t
      return applyDescriptions({ ...t, tags: t.tags || [] })
    }),
  }
}
