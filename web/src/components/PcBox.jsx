import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { PokemonDetailModal } from './PokemonDetailModal'
import { isOwnedId } from '../utils/ownedStorage'

export function PcBox({ pokemonList, pokemonById, ownedIds, onToggleOwned }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [ownedFilter, setOwnedFilter] = useState('')
  const [modalId, setModalId] = useState(null)

  const modalPokemon = modalId ? pokemonById[modalId] : null

  const types = useMemo(() => {
    const set = new Set()
    pokemonList.forEach((p) => p.types.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [pokemonList])

  const ownedCount = useMemo(
    () => pokemonList.filter((p) => isOwnedId(ownedIds, p.id)).length,
    [pokemonList, ownedIds]
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pokemonList.filter((p) => {
      if (typeFilter && !p.types.includes(typeFilter)) return false
      if (ownedFilter === 'owned' && !isOwnedId(ownedIds, p.id)) return false
      if (ownedFilter === 'not-owned' && isOwnedId(ownedIds, p.id)) return false
      if (!q) return true
      return p.name.toLowerCase().includes(q) || p.id.includes(q)
    })
  }, [pokemonList, search, typeFilter, ownedFilter, ownedIds])

  const handleToggleOwned = (pokemonId) => {
    onToggleOwned(pokemonId)
  }

  return (
    <div className="pc-box">
      <header className="pc-box__header">
        <h2>Caja Pokémon</h2>
        <p className="muted">
          {filtered.length} / {pokemonList.length} Pokémon · {ownedCount} en propiedad · Regulation
          M-B
        </p>
        <div className="pc-box__filters">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos los tipos</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select value={ownedFilter} onChange={(e) => setOwnedFilter(e.target.value)}>
            <option value="">Todos</option>
            <option value="owned">En propiedad</option>
            <option value="not-owned">Sin tener</option>
          </select>
        </div>
      </header>

      <div className="pc-box__grid">
        {filtered.map((p) => {
          const owned = isOwnedId(ownedIds, p.id)
          return (
            <button
              key={p.id}
              type="button"
              className={`pc-box__card ${owned ? 'is-owned' : ''}`}
              onClick={() => setModalId(p.id)}
            >
              {owned && <span className="pc-box__owned-mark" title="En propiedad">✓</span>}
              <PokemonSprite id={p.id} name={p.name} size={72} />
              <div className="pc-box__card-info">
                <strong>{p.name}</strong>
                <div className="type-row">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
                <span className="muted">BST {p.stats?.bst ?? '—'}</span>
              </div>
            </button>
          )
        })}
      </div>

      {modalPokemon && (
        <PokemonDetailModal
          pokemon={modalPokemon}
          isOwned={isOwnedId(ownedIds, modalPokemon.id)}
          onToggleOwned={() => handleToggleOwned(modalPokemon.id)}
          onClose={() => setModalId(null)}
        />
      )}
    </div>
  )
}
