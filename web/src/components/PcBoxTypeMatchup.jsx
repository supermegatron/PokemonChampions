import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { analyzePokemonMatchups } from '../utils/typeChart'

function MatchupList({ items, combined, variant }) {
  if (!items.length) {
    return <p className="muted pc-box__matchup-empty">Ninguno</p>
  }

  return (
    <ul className="pc-box__matchup-list">
      {items.map((item) => {
        const mult = item.multiplier ?? item.maxMultiplier ?? 0
        return (
        <li key={item.type} className={`pc-box__matchup-item pc-box__matchup-item--${variant}`}>
          <TypeBadge type={item.type} />
          <span
            className={`pc-box__matchup-mult ${mult >= 4 ? 'is-quad' : ''}`}
          >
            {item.label}
          </span>
          {combined && variant === 'weak' && item.hits?.length > 0 && (
            <span className="pc-box__matchup-detail muted">
              {item.hits.map((h) => h.name).join(', ')}
            </span>
          )}
          {combined && variant === 'coverage' && item.from?.length > 0 && (
            <span className="pc-box__matchup-detail muted">{item.from.join(', ')}</span>
          )}
        </li>
        )
      })}
    </ul>
  )
}

export function PcBoxTypeMatchup({ pokemonList, pokemonById }) {
  const [open, setOpen] = useState(false)
  const [pickerQuery, setPickerQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState([])

  const selectedPokemon = useMemo(
    () => selectedIds.map((id) => pokemonById[id]).filter(Boolean),
    [selectedIds, pokemonById]
  )

  const analysis = useMemo(() => analyzePokemonMatchups(selectedPokemon), [selectedPokemon])

  const pickerOptions = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase()
    if (!q) return pokemonList.slice(0, 12)
    return pokemonList
      .filter((p) => p.name.toLowerCase().includes(q) || p.id.includes(q))
      .slice(0, 12)
  }, [pokemonList, pickerQuery])

  const addPokemon = (id) => {
    if (!id || selectedIds.includes(id)) return
    setSelectedIds((prev) => [...prev, id])
    setPickerQuery('')
  }

  const removePokemon = (id) => {
    setSelectedIds((prev) => prev.filter((x) => x !== id))
  }

  return (
    <section className="pc-box__matchup">
      <button
        type="button"
        className={`btn btn--ghost pc-box__matchup-toggle ${open ? 'is-open' : ''} ${selectedIds.length ? 'is-active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        Análisis de tipos{selectedIds.length ? ` · ${selectedIds.length}` : ''}
      </button>

      {open && (
        <div className="pc-box__matchup-panel">
          <p className="muted pc-box__matchup-hint">
            Añade uno o varios Pokémon. Con varios, las debilidades y la cobertura STAB se
            combinan (tipos que amenazan a cualquiera del grupo / tipos que cubre el grupo).
          </p>

          <div className="pc-box__matchup-picker">
            <input
              type="search"
              placeholder="Buscar Pokémon para añadir…"
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && pickerOptions[0]) addPokemon(pickerOptions[0].id)
              }}
            />
            {pickerQuery.trim() && pickerOptions.length > 0 && (
              <ul className="pc-box__matchup-suggest">
                {pickerOptions.map((p) => (
                  <li key={p.id}>
                    <button type="button" onClick={() => addPokemon(p.id)}>
                      <PokemonSprite id={p.id} name={p.name} size={28} />
                      <span>{p.name}</span>
                      <span className="type-row type-row--inline">
                        {p.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedPokemon.length > 0 && (
            <div className="pc-box__matchup-selected">
              {selectedPokemon.map((p) => (
                <div key={p.id} className="pc-box__matchup-chip">
                  <PokemonSprite id={p.id} name={p.name} size={32} />
                  <div className="pc-box__matchup-chip-info">
                    <strong>{p.name}</strong>
                    <div className="type-row">
                      {p.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pc-box__matchup-chip-remove"
                    onClick={() => removePokemon(p.id)}
                    aria-label={`Quitar ${p.name}`}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn btn--text"
                onClick={() => setSelectedIds([])}
              >
                Limpiar
              </button>
            </div>
          )}

          {selectedPokemon.length > 0 ? (
            <div className="pc-box__matchup-columns">
              <div className="pc-box__matchup-col">
                <h3>
                  {analysis.combined ? 'Te superan (equipo)' : 'Te superan'}
                  <span className="muted">×2 o más</span>
                </h3>
                <MatchupList items={analysis.defensive} combined={analysis.combined} variant="weak" />
              </div>
              <div className="pc-box__matchup-col">
                <h3>
                  {analysis.combined ? 'Cobertura STAB (equipo)' : 'Cobertura STAB'}
                  <span className="muted">×2 o más</span>
                </h3>
                <MatchupList
                  items={analysis.offensive}
                  combined={analysis.combined}
                  variant="coverage"
                />
              </div>
            </div>
          ) : (
            <p className="muted pc-box__matchup-empty-state">
              Elige al menos un Pokémon para ver matchups de tipos.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
