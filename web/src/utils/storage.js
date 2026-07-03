import {
  buildCatalogTeams,
  createEmptyTeam,
  getSeedVersion,
  mergeCatalogIntoStored,
  normalizeSlot,
  resetCatalogTeams,
  syncDescriptionsFromRepo,
} from './teamCatalog'
import { emptyEvs } from './statCalc'

const STORAGE_KEY = 'pokemon-champions-teams-v14'

function normalizeTeamsState(state) {
  return {
    ...state,
    teams: (state.teams || []).map((team) => ({
      ...team,
      slots: (team.slots || []).map((slot) => (slot ? normalizeSlot(slot) : null)),
    })),
  }
}

function initialState() {
  return normalizeTeamsState({
    seedVersion: getSeedVersion(),
    activeTeamId: buildCatalogTeams()[0]?.id,
    teams: buildCatalogTeams(),
  })
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

    return normalizeTeamsState(state)
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
  const moves = ['', '', '', '']

  const draft = {
    pokemonId: pokemon.id,
    ability: defaultAbility?.name || '',
    item: '',
    moves,
    role: '',
    roleLabel: '',
    owned: false,
    evs: emptyEvs(),
  }

  return {
    ...draft,
    nature: defaultNatureForSlot(draft),
  }
}
