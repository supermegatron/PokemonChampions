import { useCallback, useEffect, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { labelAbilityEs, labelItemEs, labelMoveEs } from '../utils/i18nEs'
import { fetchMetaData, formatScrapedAt, refreshMetaData } from '../utils/metaTeams'

function MetaPokemonChip({ pokemonId, name, pokemonById }) {
  const mon = pokemonId ? pokemonById[pokemonId] : null
  return (
    <span className={`meta-chip${pokemonId ? '' : ' meta-chip--unknown'}`} title={pokemonId || name}>
      {pokemonId ? (
        <PokemonSprite id={pokemonId} name={mon?.name || name} size={28} />
      ) : null}
      <span>{mon?.name || name}</span>
    </span>
  )
}

function MetaTeamCard({ team, pokemonById }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="meta-team">
      <button type="button" className="meta-team__head" onClick={() => setOpen((v) => !v)}>
        <span className="meta-team__rank">{team.rank}</span>
        <div className="meta-team__summary">
          <div className="meta-team__title">
            <strong>{team.author}</strong>
            <span className="meta-team__record">{team.record}</span>
          </div>
          <p className="muted meta-team__event">{team.tournament}</p>
          <div className="meta-team__roster">
            {team.roster?.map((name) => {
              const slot = team.slots?.find((s) => s.name === name)
              return (
                <MetaPokemonChip
                  key={name}
                  pokemonId={slot?.pokemonId}
                  name={name}
                  pokemonById={pokemonById}
                />
              )
            })}
          </div>
        </div>
        <span className="meta-team__toggle">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="meta-team__details">
          {team.slots.map((slot) => {
            const mon = slot.pokemonId ? pokemonById[slot.pokemonId] : null
            return (
              <div key={`${slot.name}-${slot.ability}`} className="meta-slot">
                <div className="meta-slot__header">
                  {slot.pokemonId ? (
                    <PokemonSprite id={slot.pokemonId} name={mon?.name || slot.name} size={48} />
                  ) : null}
                  <div>
                    <h4>{mon?.name || slot.name}</h4>
                    {mon?.types && (
                      <div className="type-row">
                        {mon.types.map((t) => (
                          <TypeBadge key={t} type={t} />
                        ))}
                      </div>
                    )}
                    {!slot.pokemonId && <p className="meta-warn">Sin match en pool M-B</p>}
                  </div>
                </div>
                <ul className="meta-slot__props">
                  <li>
                    <span className="muted">Habilidad</span> {labelAbilityEs(slot.ability)}
                  </li>
                  <li>
                    <span className="muted">Objeto</span> {labelItemEs(slot.item)}
                  </li>
                </ul>
                <ul className="meta-slot__moves">
                  {slot.moves.map((m) => (
                    <li key={m}>{labelMoveEs(m)}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </article>
  )
}

export function MetaTab({ pokemonById }) {
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchMetaData()
      setMeta(data)
    } catch (err) {
      setError(err.message || 'No se pudo cargar el meta')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError('')
    try {
      const data = await refreshMetaData()
      setMeta(data)
    } catch (err) {
      setError(err.message || 'Error al actualizar')
    } finally {
      setRefreshing(false)
    }
  }

  const coresByTier = (meta?.cores || []).reduce((acc, core) => {
    const tier = core.tier || 'Cores'
    if (!acc[tier]) acc[tier] = []
    acc[tier].push(core)
    return acc
  }, {})

  return (
    <section className="meta-panel">
      <header className="meta-panel__header">
        <div>
          <h2>Meta · Regulation M-B</h2>
          <p className="muted">
            Fuente:{' '}
            <a href={meta?.source} target="_blank" rel="noreferrer">
              {meta?.sourceName || 'Pikalytics'}
            </a>
            {meta?.scrapedAt && (
              <>
                {' '}
                · Actualizado {formatScrapedAt(meta.scrapedAt)}
              </>
            )}
          </p>
          <p className="muted meta-note">
            Movimientos, objeto y habilidad por torneo. Naturaleza y Stat Points no suelen publicarse.
          </p>
        </div>
        <button
          type="button"
          className="btn btn--accent"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? 'Scrapeando…' : 'Actualizar desde Pikalytics'}
        </button>
      </header>

      {error && <p className="meta-error">{error}</p>}
      {loading && !meta && <p className="muted">Cargando meta…</p>}

      {meta && (
        <>
          <section className="meta-section">
            <h3>Top 20 uso</h3>
            <div className="meta-top20">
              {meta.top20?.map((row) => (
                <div key={row.rank} className="meta-top20__item">
                  <span className="meta-top20__rank">#{row.rank}</span>
                  {row.pokemonId ? (
                    <PokemonSprite
                      id={row.pokemonId}
                      name={pokemonById[row.pokemonId]?.name || row.name}
                      size={40}
                    />
                  ) : null}
                  <span>{pokemonById[row.pokemonId]?.name || row.name}</span>
                </div>
              ))}
            </div>
          </section>

          {Object.entries(coresByTier).map(([tier, cores]) => (
            <section key={tier} className="meta-section">
              <h3>{tier}</h3>
              <div className="meta-cores">
                {cores.map((core) => (
                  <div key={`${tier}-${core.rank}`} className="meta-core">
                    <div className="meta-core__rank">{core.rank}</div>
                    <div className="meta-core__mons">
                      {core.pokemon.map((p) => (
                        <MetaPokemonChip
                          key={p.slug}
                          pokemonId={p.pokemonId}
                          name={p.name}
                          pokemonById={pokemonById}
                        />
                      ))}
                    </div>
                    <div className="meta-core__stats muted">
                      {core.teamsLabel} · {core.usageLabel}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="meta-section">
            <h3>Equipos de torneo ({meta.teamCount || meta.teams?.length || 0})</h3>
            <div className="meta-teams">
              {meta.teams?.map((team) => (
                <MetaTeamCard
                  key={`${team.author}-${team.record}-${team.tournament}`}
                  team={team}
                  pokemonById={pokemonById}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  )
}
