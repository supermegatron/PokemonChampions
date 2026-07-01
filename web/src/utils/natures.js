import naturesData from '@data/natures.json'

const STAT_ES = {
  atk: 'Ataque',
  def: 'Defensa',
  spe: 'Velocidad',
  spa: 'At. Esp.',
  spd: 'Def. Esp.',
}

export const NATURE_ES = {
  Adamant: 'Firme',
  Bold: 'Osada',
  Brave: 'Audaz',
  Calm: 'Serena',
  Careful: 'Cauta',
  Gentle: 'Amable',
  Hasty: 'Activa',
  Impish: 'Agitada',
  Jolly: 'Alegre',
  Lax: 'Floja',
  Lonely: 'Huraña',
  Mild: 'Afable',
  Modest: 'Modesta',
  Naive: 'Ingenua',
  Naughty: 'Pícara',
  Quiet: 'Mansa',
  Rash: 'Alocada',
  Relaxed: 'Plácida',
  Sassy: 'Grosera',
  Serious: 'Seria',
  Timid: 'Miedosa',
  Hardy: 'Fuerte',
  Docile: 'Dócil',
  Bashful: 'Tímida',
  Quirky: 'Rara',
}

export const natureList = naturesData.natures

export function labelNatureEs(name) {
  if (!name) return '— Sin definir —'
  const es = NATURE_ES[name]
  return es ? `${name} · ${es}` : name
}

export function natureHint(name) {
  const n = natureList.find((x) => x.name === name)
  if (!n) return ''
  if (!n.plus && !n.minus) return 'Neutra'
  const plus = STAT_ES[n.plus] || n.plus
  const minus = STAT_ES[n.minus] || n.minus
  return `+${plus} · −${minus}`
}

/** Default competitivo según perfil del slot (sets del catálogo). */
export function defaultNatureForSlot(slot) {
  if (!slot?.pokemonId) return 'Serious'
  const moves = (slot.moves || []).map((m) => m.toLowerCase())
  const physical = moves.some((m) =>
    ['outrage', 'stone edge', 'iron head', 'flare blitz', 'extreme speed', 'icicle crash',
      'close combat', 'ice punch', 'gunk shot', 'crunch', 'wave crash', 'earthquake',
      'iron head', 'rock slide', 'knock off', 'low kick', 'body press', 'superpower',
      'aqua jet'].includes(m)
  )
  const special = moves.some((m) =>
    ['hyper voice', 'moonblast', 'make it rain', 'shadow ball', 'flash cannon', 'snarl',
      'blizzard', 'freeze-dry', 'giga drain', 'muddy water', 'hurricane', 'psychic',
      'weather ball'].includes(m)
  )
  const support = moves.some((m) =>
    ['fake out', 'tailwind', 'will-o-wisp', 'taunt', 'encore', 'yawn', 'glare',
      'parting shot', 'nuzzle', 'hypnosis', 'stealth rock', 'aurora veil'].includes(m)
  )

  if (support && !physical && !special) {
    if (slot.pokemonId.includes('incineroar') || slot.pokemonId === 'arcanine') return 'Careful'
    if (slot.pokemonId === 'whimsicott' || slot.pokemonId === 'raichu') return 'Timid'
    if (slot.pokemonId === 'pelipper' || slot.pokemonId === 'politoed') return 'Bold'
    return 'Bold'
  }
  if (special && !physical) return 'Modest'
  if (physical && !special) return 'Adamant'
  if (physical && special) return 'Naive'
  return 'Serious'
}
