export const ALL_TYPES = [
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

const SUPER_EFFECTIVE = {
  Fire: ['Grass', 'Ice', 'Bug', 'Steel'],
  Water: ['Fire', 'Ground', 'Rock'],
  Electric: ['Water', 'Flying'],
  Grass: ['Water', 'Ground', 'Rock'],
  Ice: ['Grass', 'Ground', 'Flying', 'Dragon'],
  Fighting: ['Normal', 'Ice', 'Rock', 'Dark', 'Steel'],
  Poison: ['Grass', 'Fairy'],
  Ground: ['Fire', 'Electric', 'Poison', 'Rock', 'Steel'],
  Flying: ['Grass', 'Fighting', 'Bug'],
  Psychic: ['Fighting', 'Poison'],
  Bug: ['Grass', 'Psychic', 'Dark'],
  Rock: ['Fire', 'Ice', 'Flying', 'Bug'],
  Ghost: ['Psychic', 'Ghost'],
  Dragon: ['Dragon'],
  Dark: ['Psychic', 'Ghost'],
  Steel: ['Ice', 'Rock', 'Fairy'],
  Fairy: ['Fighting', 'Dragon', 'Dark'],
}

const NOT_VERY_EFFECTIVE = {
  Normal: ['Rock', 'Steel'],
  Fire: ['Fire', 'Water', 'Grass', 'Ice', 'Dragon', 'Steel'],
  Water: ['Water', 'Grass', 'Dragon'],
  Electric: ['Electric', 'Grass', 'Dragon'],
  Grass: ['Fire', 'Grass', 'Poison', 'Flying', 'Bug', 'Dragon', 'Steel'],
  Ice: ['Fire', 'Water', 'Ice', 'Steel'],
  Fighting: ['Poison', 'Flying', 'Psychic', 'Bug', 'Fairy'],
  Poison: ['Poison', 'Ground', 'Rock', 'Ghost'],
  Ground: ['Grass', 'Bug'],
  Flying: ['Electric', 'Rock', 'Steel'],
  Psychic: ['Psychic', 'Steel'],
  Bug: ['Fire', 'Fighting', 'Poison', 'Flying', 'Ghost', 'Steel', 'Fairy'],
  Rock: ['Fighting', 'Ground', 'Steel'],
  Ghost: ['Dark'],
  Dragon: ['Steel'],
  Dark: ['Fighting', 'Dark', 'Fairy'],
  Steel: ['Fire', 'Water', 'Electric', 'Steel'],
  Fairy: ['Fire', 'Poison', 'Steel'],
}

const IMMUNE = {
  Normal: ['Ghost'],
  Fighting: ['Ghost'],
  Poison: ['Steel'],
  Ground: ['Flying'],
  Ghost: ['Normal'],
  Electric: ['Ground'],
  Psychic: ['Dark'],
  Dragon: ['Fairy'],
}

export function typeMultiplier(attackType, defenseType) {
  if (IMMUNE[attackType]?.includes(defenseType)) return 0
  if (SUPER_EFFECTIVE[attackType]?.includes(defenseType)) return 2
  if (NOT_VERY_EFFECTIVE[attackType]?.includes(defenseType)) return 0.5
  return 1
}

/** Multiplicador defensivo de un tipo atacante contra uno o dos tipos defensor. */
export function defensiveMultiplier(attackType, defenderTypes = []) {
  if (!defenderTypes.length) return 1
  return defenderTypes.reduce((acc, def) => acc * typeMultiplier(attackType, def), 1)
}

function formatMult(mult) {
  if (mult >= 4) return '×4'
  if (mult >= 2) return '×2'
  if (mult <= 0) return '×0'
  if (mult <= 0.25) return '×¼'
  if (mult <= 0.5) return '×½'
  return '×1'
}

/** Tipos que hacen ≥×2 al defensor. */
export function getDefensiveWeaknesses(defenderTypes) {
  return ALL_TYPES.map((attackType) => ({
    attackType,
    multiplier: defensiveMultiplier(attackType, defenderTypes),
  }))
    .filter(({ multiplier }) => multiplier >= 2)
    .sort((a, b) => b.multiplier - a.multiplier || a.attackType.localeCompare(b.attackType))
    .map(({ attackType, multiplier }) => ({
      type: attackType,
      multiplier,
      label: formatMult(multiplier),
    }))
}

/** Tipos que reciben ≥×2 de los STAB del atacante. */
export function getOffensiveCoverage(attackerTypes) {
  const best = new Map()
  for (const stab of attackerTypes) {
    for (const defenseType of ALL_TYPES) {
      const mult = typeMultiplier(stab, defenseType)
      if (mult >= 2) {
        best.set(defenseType, Math.max(best.get(defenseType) || 0, mult))
      }
    }
  }
  return [...best.entries()]
    .map(([type, multiplier]) => ({
      type,
      multiplier,
      label: formatMult(multiplier),
    }))
    .sort((a, b) => b.multiplier - a.multiplier || a.type.localeCompare(b.type))
}

/** Debilidades combinadas de varios Pokémon (tipos que amenazan al equipo). */
export function getTeamDefensiveWeaknesses(pokemonList) {
  const byAttack = new Map()

  for (const pokemon of pokemonList) {
    for (const { type, multiplier, label } of getDefensiveWeaknesses(pokemon.types)) {
      const entry = byAttack.get(type) || {
        type,
        maxMultiplier: 0,
        label: '×2',
        hits: [],
      }
      entry.maxMultiplier = Math.max(entry.maxMultiplier, multiplier)
      entry.label = formatMult(entry.maxMultiplier)
      entry.hits.push({ name: pokemon.name, multiplier, label: formatMult(multiplier) })
      byAttack.set(type, entry)
    }
  }

  return [...byAttack.values()].sort(
    (a, b) => b.maxMultiplier - a.maxMultiplier || a.type.localeCompare(b.type)
  )
}

/** Cobertura STAB combinada de varios Pokémon. */
export function getTeamOffensiveCoverage(pokemonList) {
  const byDefense = new Map()

  for (const pokemon of pokemonList) {
    for (const { type, multiplier, label } of getOffensiveCoverage(pokemon.types)) {
      const entry = byDefense.get(type) || {
        type,
        maxMultiplier: 0,
        label: '×2',
        from: [],
      }
      entry.maxMultiplier = Math.max(entry.maxMultiplier, multiplier)
      entry.label = formatMult(entry.maxMultiplier)
      if (!entry.from.includes(pokemon.name)) entry.from.push(pokemon.name)
      byDefense.set(type, entry)
    }
  }

  return [...byDefense.values()].sort(
    (a, b) => b.maxMultiplier - a.maxMultiplier || a.type.localeCompare(b.type)
  )
}

export function analyzePokemonMatchups(pokemonList) {
  if (!pokemonList.length) {
    return { defensive: [], offensive: [], combined: false }
  }
  if (pokemonList.length === 1) {
    const types = pokemonList[0].types
    return {
      defensive: getDefensiveWeaknesses(types),
      offensive: getOffensiveCoverage(types),
      combined: false,
    }
  }
  return {
    defensive: getTeamDefensiveWeaknesses(pokemonList),
    offensive: getTeamOffensiveCoverage(pokemonList),
    combined: true,
  }
}

/** ¿Algún STAB del equipo hace ≥×2 a un Pokémon de este tipo? */
export function teamCoversType(threatType, pokemonList) {
  if (!threatType || !pokemonList?.length) return false
  return pokemonList.some((pokemon) =>
    (pokemon.types || []).some((stab) => typeMultiplier(stab, threatType) >= 2)
  )
}

/**
 * Tipos que amenazan al equipo (≥×2) sin respuesta ofensiva STAB ≥×2 en el roster.
 */
export function getUncoveredTeamWeaknesses(pokemonList) {
  if (!pokemonList?.length) return []

  const threats = getTeamDefensiveWeaknesses(pokemonList)
  return threats
    .filter((threat) => !teamCoversType(threat.type, pokemonList))
    .map((threat) => ({
      ...threat,
      threatenedCount: threat.hits?.length ?? 0,
    }))
    .sort(
      (a, b) =>
        b.maxMultiplier - a.maxMultiplier ||
        b.threatenedCount - a.threatenedCount ||
        a.type.localeCompare(b.type)
    )
}
