import {
  buildCatalogTeams,
  createEmptyTeam,
  getSeedVersion,
  mergeCatalogIntoStored,
  resetCatalogTeams,
  syncDescriptionsFromRepo,
} from './teamCatalog'

const STORAGE_KEY = 'pokemon-champions-teams-v8'

function initialState() {
  return {
    seedVersion: getSeedVersion(),
    activeTeamId: buildCatalogTeams()[0]?.id,
    teams: buildCatalogTeams(),
  }
}

export function loadTeams() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState()

    const parsed = JSON.parse(raw)
    if (!parsed?.teams?.length) return initialState()

    const needsCatalogRefresh = (parsed.seedVersion ?? 0) < getSeedVersion()
    let state = mergeCatalogIntoStored(parsed, { refreshCatalog: needsCatalogRefresh })
    if (needsCatalogRefresh) {
      state = { ...state, seedVersion: getSeedVersion() }
    }

    return state
  } catch {
    return initialState()
  }
}

export function saveTeams(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function resetFromCatalog(stored) {
  return resetCatalogTeams(stored)
}

export function syncDescriptions(stored) {
  return syncDescriptionsFromRepo(stored)
}

export function addTeam(stored, name) {
  const team = createEmptyTeam(name)
  return {
    ...stored,
    activeTeamId: team.id,
    teams: [...stored.teams, team],
  }
}

export function removeTeam(stored, teamId) {
  if (stored.teams.length <= 1) return stored
  const teams = stored.teams.filter((t) => t.id !== teamId)
  return {
    ...stored,
    activeTeamId: stored.activeTeamId === teamId ? teams[0].id : stored.activeTeamId,
    teams,
  }
}

import { defaultNatureForSlot } from './natures'

export function buildSlotFromPokemon(pokemon) {
  const defaultAbility = pokemon.abilities.find((a) => a.hidden) || pokemon.abilities[0]
  const moves = pokemon.moves.slice(0, 4).map((m) => m.name)
  while (moves.length < 4) moves.push('')

  const draft = {
    pokemonId: pokemon.id,
    ability: defaultAbility?.name || '',
    item: '',
    moves,
    role: '',
    roleLabel: '',
    owned: false,
  }

  return {
    ...draft,
    nature: defaultNatureForSlot(draft),
  }
}
