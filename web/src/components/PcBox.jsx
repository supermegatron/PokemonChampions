import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { PokemonDetailModal } from './PokemonDetailModal'
import { isOwnedId } from '../utils/ownedStorage'
import {
  buildPcSearchVocab,
  filterPcBoxPokemon,
  hasAdvancedFilters,
} from '../utils/pcBoxSearch'
import { PcBoxTypeMatchup } from './PcBoxTypeMatchup'
import { abilityEsOnly, moveEsOnly } from '../utils/i18nEs'

export function PcBox({ pokemonList, pokemonById, ownedIds, onToggleOwned }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [ownedFilter, setOwnedFilter] = useState('')
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [moveQuery, setMoveQuery] = useState('')
  const [abilityQuery, setAbilityQuery] = useState('')
  const [statQuery, setStatQuery] = useState('')
  const [hiddenAbilityOnly, setHiddenAbilityOnly] = useState(false)
  const [modalId, setModalId] = useState(null)

  const modalPokemon = modalId ? pokemonById[modalId] : null

  const types = useMemo(() => {
    const set = new Set()
    pokemonList.forEach((p) => p.types.forEach((t) => set.add(t)))
    return [...set].sort()
  }, [pokemonList])

  const vocab = useMemo(() => buildPcSearchVocab(pokemonList), [pokemonList])

  const ownedCount = useMemo(
    () => pokemonList.filter((p) => isOwnedId(ownedIds, p.id)).length,
    [pokemonList, ownedIds]
  )

  const filtered = useMemo(
    () =>
      filterPcBoxPokemon(pokemonList, {
        nameQuery: search,
        typeFilter,
        ownedFilter,
        moveQuery,
        abilityQuery,
        statQuery,
        hiddenAbilityOnly,
        ownedIds,
        isOwnedId,
      }),
    [pokemonList, search, typeFilter, ownedFilter, moveQuery, abilityQuery, statQuery, hiddenAbilityOnly, ownedIds]
  )

  const advancedActive = hasAdvancedFilters({ moveQuery, abilityQuery, statQuery, hiddenAbilityOnly })

  const clearAdvanced = () => {
    setMoveQuery('')
    setAbilityQuery('')
    setStatQuery('')
    setHiddenAbilityOnly(false)
  }

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
          <button
            type="button"
            className={`btn btn--ghost pc-box__advanced-toggle ${advancedOpen ? 'is-open' : ''} ${advancedActive ? 'is-active' : ''}`}
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            Búsqueda avanzada{advancedActive ? ' · activa' : ''}
          </button>
        </div>

        {advancedOpen && (
          <div className="pc-box__advanced">
            <p className="muted pc-box__advanced-hint">
              Filtra por movimiento, habilidad o stats base Lv50. Varios movimientos u
              habilidades separados por coma (debe tener todos). P. ej.{' '}
              <code>Tailwind, Fake Out</code>, <code>spa &gt; 120</code>.
            </p>
            <div className="pc-box__advanced-row">
              <label className="field field--compact">
                <span>Movimiento</span>
                <input
                  type="search"
                  list="pc-move-list"
                  placeholder="Ej. Tailwind, Fake Out…"
                  value={moveQuery}
                  onChange={(e) => setMoveQuery(e.target.value)}
                />
              </label>
              <label className="field field--compact">
                <span>Habilidad</span>
                <input
                  type="search"
                  list="pc-ability-list"
                  placeholder="Ej. Prankster, Bromista…"
                  value={abilityQuery}
                  onChange={(e) => setAbilityQuery(e.target.value)}
                />
              </label>
              <label className="field field--compact">
                <span>Stats (Lv50)</span>
                <input
                  type="search"
                  placeholder="Ej. spa > 120, spe >= 150, bst > 500"
                  value={statQuery}
                  onChange={(e) => setStatQuery(e.target.value)}
                />
              </label>
              <label className="field field--compact field--checkbox">
                <input
                  type="checkbox"
                  checked={hiddenAbilityOnly}
                  onChange={(e) => setHiddenAbilityOnly(e.target.checked)}
                  disabled={!abilityQuery.trim()}
                />
                <span>Solo habilidad oculta (HA)</span>
              </label>
              {advancedActive && (
                <button type="button" className="btn btn--text" onClick={clearAdvanced}>
                  Limpiar avanzada
                </button>
              )}
            </div>
            <datalist id="pc-move-list">
              {vocab.moves.map((name) => {
                const es = moveEsOnly(name)
                return (
                  <option key={name} value={name}>
                    {es !== name ? es : undefined}
                  </option>
                )
              })}
            </datalist>
            <datalist id="pc-ability-list">
              {vocab.abilities.map((name) => {
                const es = abilityEsOnly(name)
                return (
                  <option key={name} value={name}>
                    {es !== name ? es : undefined}
                  </option>
                )
              })}
            </datalist>
          </div>
        )}
        <PcBoxTypeMatchup pokemonList={pokemonList} pokemonById={pokemonById} />
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

      {filtered.length === 0 && (
        <p className="muted pc-box__empty">Ningún Pokémon coincide con los filtros.</p>
      )}

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
