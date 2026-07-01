import { useEffect, useMemo, useRef, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import {
  PRIORITY_LABEL,
  PRIORITY_ORDER,
  collectTeamNames,
  parseTeamsInput,
  sortWishlistItems,
} from '../utils/wishlistStorage'

const TEAMS_DATALIST_ID = 'wishlist-teams-datalist'

function TeamsField({ inputRef, value, onChange, onCommit, placeholder }) {
  return (
    <input
      ref={inputRef}
      type="text"
      list={TEAMS_DATALIST_ID}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={(e) => onCommit?.(e.target.value)}
      placeholder={placeholder}
    />
  )
}

function TeamTags({ teams }) {
  if (!teams?.length) return null
  return (
    <div className="wishlist__team-tags">
      {teams.map((t) => (
        <span key={t} className="wishlist__team-tag">
          {t}
        </span>
      ))}
    </div>
  )
}

export function Wishlist({
  pokemonList,
  pokemonById,
  items,
  onAdd,
  onUpdate,
  onRemove,
}) {
  const [addSearch, setAddSearch] = useState('')
  const [priority, setPriority] = useState('alta')
  const [teamsInput, setTeamsInput] = useState('')
  const [notes, setNotes] = useState('')
  const [pickId, setPickId] = useState('')
  const addTeamsRef = useRef(null)

  const [listSearch, setListSearch] = useState('')
  const [filterPriority, setFilterPriority] = useState('')
  const [filterTeam, setFilterTeam] = useState('')

  const knownTeams = useMemo(() => collectTeamNames(items), [items])
  const wishedIds = useMemo(() => new Set(items.map((i) => i.pokemonId)), [items])

  const filteredList = useMemo(() => {
    const q = listSearch.trim().toLowerCase()
    return sortWishlistItems(items).filter((item) => {
      if (filterPriority && item.priority !== filterPriority) return false
      if (filterTeam && !(item.teams || []).includes(filterTeam)) return false
      if (!q) return true
      const teamText = (item.teams || []).join(' ').toLowerCase()
      return (
        item.name.toLowerCase().includes(q) ||
        item.pokemonId.includes(q) ||
        teamText.includes(q) ||
        (item.notes || '').toLowerCase().includes(q)
      )
    })
  }, [items, listSearch, filterPriority, filterTeam])

  const candidates = useMemo(() => {
    const q = addSearch.trim().toLowerCase()
    return pokemonList
      .filter((p) => !wishedIds.has(p.id))
      .filter((p) => {
        if (!q) return true
        return p.name.toLowerCase().includes(q) || p.id.includes(q)
      })
      .slice(0, 24)
  }, [pokemonList, addSearch, wishedIds])

  const handleAdd = () => {
    const mon = pickId ? pokemonById[pickId] : null
    if (!mon) return
    const teamsRaw = addTeamsRef.current?.value ?? teamsInput
    const teams = parseTeamsInput(teamsRaw)
    onAdd({
      pokemonId: mon.id,
      name: mon.name,
      priority,
      teams,
      notes,
    })
    if (teams.length === 1) setFilterTeam(teams[0])
    setPickId('')
    setAddSearch('')
    setTeamsInput('')
    setNotes('')
  }

  return (
    <div className="wishlist">
      {knownTeams.length > 0 && (
        <datalist id={TEAMS_DATALIST_ID}>
          {knownTeams.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      )}

      <header className="wishlist__header">
        <h2>Pokémon que buscamos</h2>
        <p className="muted">
          Fichajes objetivo · {items.length} en lista · equipos libres (los escribes tú)
        </p>
      </header>

      <section className="wishlist__add">
        <h3>Añadir otro</h3>
        <div className="wishlist__add-row">
          <input
            type="search"
            placeholder="Buscar en el pool M-B…"
            value={addSearch}
            onChange={(e) => {
              setAddSearch(e.target.value)
              setPickId('')
            }}
          />
          <select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                Prioridad {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
        </div>

        {addSearch && (
          <div className="wishlist__candidates">
            {candidates.map((p) => (
              <button
                key={p.id}
                type="button"
                className={`wishlist__pick ${pickId === p.id ? 'is-picked' : ''}`}
                onClick={() => setPickId(p.id)}
              >
                <PokemonSprite id={p.id} name={p.name} size={48} />
                <span>{p.name}</span>
              </button>
            ))}
            {candidates.length === 0 && <p className="muted">Sin resultados</p>}
          </div>
        )}

        <label className="field field--compact field--wide">
          <span>Equipos (separados por comas)</span>
          <TeamsField
            inputRef={addTeamsRef}
            value={teamsInput}
            onChange={setTeamsInput}
            onCommit={setTeamsInput}
            placeholder="Ej. Nieve · Velo Aurora, Lluvia off-meta"
          />
          <small className="field-hint">
            Escribe el nombre del equipo a mano. Si es nuevo, aparecerá solo en los filtros.
          </small>
        </label>

        <label className="field field--compact field--wide">
          <span>Notas</span>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Rol, movimientos, etc."
          />
        </label>

        <button
          type="button"
          className="btn btn--sm btn--accent"
          disabled={!pickId}
          onClick={handleAdd}
        >
          Añadir a la lista
        </button>
      </section>

      <section className="wishlist__filters">
        <h3>Filtrar lista</h3>
        <div className="wishlist__filters-row">
          <input
            type="search"
            placeholder="Buscar Pokémon o equipo…"
            value={listSearch}
            onChange={(e) => setListSearch(e.target.value)}
          />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            aria-label="Filtrar por prioridad"
          >
            <option value="">Todas las prioridades</option>
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                Prioridad {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          <select
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
            aria-label="Filtrar por equipo"
          >
            <option value="">Todos los equipos</option>
            {knownTeams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        {(filterPriority || filterTeam || listSearch) && (
          <p className="muted wishlist__filter-hint">
            Mostrando {filteredList.length} de {items.length}
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                setListSearch('')
                setFilterPriority('')
                setFilterTeam('')
              }}
            >
              Limpiar filtros
            </button>
          </p>
        )}
      </section>

      <section className="wishlist__list">
        {filteredList.length === 0 ? (
          <p className="wishlist__empty muted">
            {items.length === 0
              ? 'La lista está vacía.'
              : 'Ningún Pokémon coincide con los filtros.'}
          </p>
        ) : (
          filteredList.map((item) => (
            <WishlistCard
              key={item.id}
              item={item}
              mon={pokemonById[item.pokemonId]}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))
        )}
      </section>
    </div>
  )
}

function WishlistCard({ item, mon, onUpdate, onRemove }) {
  const teamsText = (item.teams || []).join(', ')
  const [editTeams, setEditTeams] = useState(teamsText)

  useEffect(() => {
    setEditTeams(teamsText)
  }, [teamsText])

  return (
    <article className={`wishlist__card priority--${item.priority}`}>
      <div className="wishlist__card-main">
        {mon && <PokemonSprite id={mon.id} name={mon.name} size={64} />}
        <div className="wishlist__card-body">
          <div className="wishlist__card-title">
            <strong>{item.name}</strong>
            <span className={`wishlist__priority priority-pill--${item.priority}`}>
              {PRIORITY_LABEL[item.priority]}
            </span>
          </div>
          {mon && (
            <div className="type-row">
              {mon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
          )}
          <TeamTags teams={item.teams} />
          {item.notes && <p className="wishlist__notes">{item.notes}</p>}
        </div>
      </div>
      <div className="wishlist__card-edit">
        <label className="field field--compact field--wide">
          <span>Equipos</span>
          <TeamsField
            value={editTeams}
            onChange={setEditTeams}
            onCommit={(raw) => onUpdate(item.id, { teams: parseTeamsInput(raw) })}
            placeholder="Nombre del equipo…"
          />
        </label>
        <div className="wishlist__card-actions">
          <select
            value={item.priority}
            onChange={(e) => onUpdate(item.id, { priority: e.target.value })}
            aria-label="Prioridad"
          >
            {PRIORITY_ORDER.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={() => onRemove(item.id)}
          >
            Quitar
          </button>
        </div>
      </div>
    </article>
  )
}
