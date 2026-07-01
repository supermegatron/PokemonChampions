import pokemonData from '@data/pokemon.json'
import itemsData from '@data/items.json'
import indexData from '@data/index.json'
import { natureList } from '../utils/natures'

const pokemonList = Object.values(pokemonData).sort((a, b) => a.name.localeCompare(b.name))

const pokemonById = pokemonData

export function useGameData() {
  return {
    pokemonList,
    pokemonById,
    index: indexData,
    items: itemsData.items,
    regulation: itemsData.regulation,
    natures: natureList,
  }
}
