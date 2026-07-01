import { useEffect, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { abilityEsOnly, labelAbilityEs } from '../utils/i18nEs'

const STAT_META = [
  { key: 'hp', label: 'PS', color: '#ef4444' },
  { key: 'atk', label: 'Ataque', color: '#f97316' },
  { key: 'def', label: 'Defensa', color: '#eab308' },
  { key: 'spa', label: 'At. Esp.', color: '#3b82f6' },
  { key: 'spd', label: 'Def. Esp.', color: '#8b5cf6' },
  { key: 'spe', label: 'Velocidad', color: '#ec4899' },
]

const STAT_MAX = {
  hp: 235,
  atk: 205,
  def: 250,
  spa: 195,
  spd: 174,
  spe: 170,
}

export function PokemonDetailModal({ pokemon, isOwned, onToggleOwned, onClose }) {
  const [activeAbility, setActiveAbility] = useState(null)

  useEffect(() => {
    setActiveAbility(pokemon?.abilities?.[0]?.name ?? null)
  }, [pokemon?.id])

  useEffect(() => {
    if (!pokemon) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [pokemon, onClose])

  if (!pokemon) return null

  const active = pokemon.abilities.find((a) => a.name === activeAbility)

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal pokemon-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pokemon-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="modal__close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        <header className="pokemon-modal__header">
          <PokemonSprite id={pokemon.id} name={pokemon.name} size={96} />
          <div>
            <h2 id="pokemon-modal-title">{pokemon.name}</h2>
            <div className="type-row">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <p className="muted pokemon-modal__bst">
              Total {pokemon.stats?.bst ?? '—'} · Stats M-B (nivel 50)
            </p>
          </div>
        </header>

        <section className="pokemon-modal__section">
          <h3>Estadísticas base</h3>
          <div className="stat-bars">
            {STAT_META.map(({ key, label, color }) => {
              const raw = pokemon.stats?.[key]
              const value =
                raw ??
                (key === 'spe' && pokemon.stats?.bst
                  ? pokemon.stats.bst -
                    STAT_META.filter((m) => m.key !== 'spe').reduce(
                      (sum, m) => sum + (pokemon.stats?.[m.key] ?? 0),
                      0
                    )
                  : null)
              const display = value != null && value > 0 ? value : '—'
              const pct =
                typeof value === 'number' && value > 0
                  ? Math.min(100, Math.round((value / STAT_MAX[key]) * 100))
                  : 0
              return (
                <div key={key} className="stat-bar">
                  <span className="stat-bar__label">{label}</span>
                  <div className="stat-bar__track">
                    <div
                      className="stat-bar__fill"
                      style={{ width: `${pct}%`, background: color }}
                    />
                  </div>
                  <span className="stat-bar__value">{display}</span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="pokemon-modal__section">
          <h3>Habilidades</h3>
          <div className="ability-pills">
            {pokemon.abilities.map((ability) => (
              <button
                key={ability.name}
                type="button"
                className={`ability-pill ${activeAbility === ability.name ? 'is-active' : ''}`}
                onClick={() => setActiveAbility(ability.name)}
              >
                {labelAbilityEs(ability.name)}
                {ability.hidden && <span className="ability-pill__ha">HA</span>}
              </button>
            ))}
          </div>
          {active && (
            <div className="ability-detail">
              <strong>{abilityEsOnly(active.name) || active.name}</strong>
              <p>{active.description || 'Sin descripción en el dataset.'}</p>
            </div>
          )}
        </section>

        <footer className="pokemon-modal__footer">
          <button
            type="button"
            className={`btn btn--sm ${isOwned ? 'btn--owned' : 'btn--ghost'}`}
            onClick={onToggleOwned}
          >
            {isOwned ? '✓ En mi propiedad' : '+ Marcar en propiedad'}
          </button>
        </footer>
      </div>
    </div>
  )
}
