import { useMemo, useState } from 'react'
import { TypeBadge } from './TypeBadge'
import { getUncoveredTeamWeaknesses, getTeamDefensiveWeaknesses } from '../utils/typeChart'

export function TeamWeaknessPanel({ team, pokemonById }) {
  const [open, setOpen] = useState(false)

  const rosterPokemon = useMemo(
    () =>
      (team?.slots || [])
        .map((slot) => (slot?.pokemonId ? pokemonById[slot.pokemonId] : null))
        .filter(Boolean),
    [team?.slots, pokemonById]
  )

  const uncovered = useMemo(() => getUncoveredTeamWeaknesses(rosterPokemon), [rosterPokemon])
  const allThreats = useMemo(() => getTeamDefensiveWeaknesses(rosterPokemon), [rosterPokemon])
  const coveredCount = allThreats.length - uncovered.length

  return (
    <section className="team-weakness">
      <button
        type="button"
        className={`btn btn--ghost team-weakness__toggle ${open ? 'is-open' : ''} ${uncovered.length ? 'has-gaps' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        Ver debilidades
        {rosterPokemon.length > 0 && (
          <span className="team-weakness__badge">
            {uncovered.length ? `${uncovered.length} sin cubrir` : 'OK'}
          </span>
        )}
      </button>

      {open && (
        <div className="team-weakness__panel">
          {rosterPokemon.length === 0 ? (
            <p className="muted">Añade Pokémon al roster para analizar debilidades.</p>
          ) : (
            <>
              <p className="muted team-weakness__hint">
                Tipos que hacen ≥×2 a alguien del equipo y que <strong>ningún STAB del roster</strong>{' '}
                responde con ≥×2 (p. ej. te presionan Hielo y no llevas Fuego/Lucha/Roca/Acero).
              </p>

              {uncovered.length === 0 ? (
                <p className="team-weakness__ok">
                  {allThreats.length === 0
                    ? 'Ningún tipo te hace ×2 o más con este roster.'
                    : `Todas las amenazas (${allThreats.length}) tienen cobertura STAB ×2 en el equipo.`}
                </p>
              ) : (
                <ul className="team-weakness__list">
                  {uncovered.map((item) => (
                    <li key={item.type} className="team-weakness__item">
                      <div className="team-weakness__head">
                        <TypeBadge type={item.type} />
                        <span className="team-weakness__mult">{item.label}</span>
                        <span className="team-weakness__tag">Sin cubrir</span>
                      </div>
                      <p className="muted team-weakness__targets">
                        Amenaza a:{' '}
                        {item.hits?.map((h) => `${h.name} (${h.label})`).join(' · ')}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              {coveredCount > 0 && (
                <details className="team-weakness__covered">
                  <summary className="muted">
                    {coveredCount} amenaza{coveredCount !== 1 ? 's' : ''} con cobertura STAB
                  </summary>
                  <ul className="team-weakness__list team-weakness__list--muted">
                    {allThreats
                      .filter((t) => !uncovered.some((u) => u.type === t.type))
                      .map((item) => (
                        <li key={item.type} className="team-weakness__item team-weakness__item--ok">
                          <TypeBadge type={item.type} />
                          <span className="team-weakness__mult">{item.label}</span>
                          <span className="muted">{item.hits?.map((h) => h.name).join(', ')}</span>
                        </li>
                      ))}
                  </ul>
                </details>
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
