import { useState, useRef, useEffect } from 'react'
import { PokemonPickerModal } from './PokemonPickerModal'
import { PokemonSlotModal } from './PokemonSlotModal'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { TeamMetaEditor } from './TeamMetaEditor'
import { ROLE_ES } from '../utils/i18nEs'
import { labelNatureEs } from '../utils/natures'

const ROLE_CLASS = {
  nucleo: 'role-nucleo',
  flex: 'role-flex',
  senal: 'role-senal',
}

function shortTeamLabel(name) {
  if (!name) return 'Equipo'
  const part = name.split('·')[0]?.trim() || name
  return part.length > 22 ? `${part.slice(0, 20)}…` : part
}

export function TeamBuilder({
  teams,
  activeTeamId,
  onSelectTeam,
  onAddTeam,
  onDeleteTeam,
  onResetCatalog,
  onSyncDescriptions,
  onUpdateTeamMeta,
  team,
  ownedPokemonIds,
  pokemonList,
  pokemonById,
  items,
  natures,
  selectedSlotIndex,
  onSelectSlot,
  onUpdateSlot,
  onClearSlot,
  onAddPokemon,
}) {
  const [editingMeta, setEditingMeta] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [slotModalOpen, setSlotModalOpen] = useState(false)
  const menuRef = useRef(null)

  const activeSlot = selectedSlotIndex != null ? team.slots[selectedSlotIndex] : null
  const activePokemon = activeSlot?.pokemonId ? pokemonById[activeSlot.pokemonId] : null
  const ownedSet = new Set(ownedPokemonIds || [])

  const isOwned = (slot) =>
    slot?.owned || (slot?.pokemonId && ownedSet.has(slot.pokemonId))

  useEffect(() => {
    setEditingMeta(false)
    setMenuOpen(false)
    setSlotModalOpen(false)
  }, [activeTeamId])

  useEffect(() => {
    if (!menuOpen) return
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [menuOpen])

  const handleSlotClick = (index) => {
    onSelectSlot(index)
    setSlotModalOpen(true)
  }

  const closeSlotModal = () => setSlotModalOpen(false)

  const handlePickPokemon = (pokemon) => {
    onAddPokemon(selectedSlotIndex, pokemon)
  }

  const handleClearSlot = () => {
    onClearSlot(selectedSlotIndex)
    closeSlotModal()
  }

  const hasMeta =
    team.description || team.recruitHint || team.bringHint || team.notes

  return (
    <div className="team-builder">
      <div className="team-bar">
        <div className="team-bar__tabs" role="tablist">
          {teams.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={t.id === activeTeamId}
              title={t.name}
              className={`team-tab ${t.id === activeTeamId ? 'is-active' : ''}`}
              onClick={() => onSelectTeam(t.id)}
            >
              {shortTeamLabel(t.name)}
            </button>
          ))}
        </div>

        <div className="team-bar__actions">
          <button type="button" className="btn btn--sm btn--accent" onClick={onAddTeam}>
            + Nuevo
          </button>
          <div className="team-menu" ref={menuRef}>
            <button
              type="button"
              className="btn btn--sm btn--icon"
              aria-label="Opciones"
              onClick={(e) => {
                e.stopPropagation()
                setMenuOpen((v) => !v)
              }}
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="team-menu__panel">
                <button
                  type="button"
                  onClick={() => {
                    setEditingMeta(true)
                    setMenuOpen(false)
                  }}
                >
                  Editar nombre y notas
                </button>
                {teams.length > 1 && (
                  <button
                    type="button"
                    className="is-danger"
                    onClick={() => {
                      setMenuOpen(false)
                      onDeleteTeam()
                    }}
                  >
                    Eliminar este equipo
                  </button>
                )}
                <hr />
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onSyncDescriptions()
                  }}
                >
                  Recuperar textos por defecto
                  <small>Solo descripción y notas, sin tocar Pokémon</small>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false)
                    onResetCatalog()
                  }}
                >
                  Resetear equipos predefinidos
                  <small>Vuelve sets y textos de fábrica</small>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="team-summary">
        <div className="team-summary__row">
          <div className="team-summary__title">
            <h2>{team.name}</h2>
            <div className="team-summary__badges">
              {team.cover && <span className="pill pill--cover">Cover</span>}
              <span className="pill pill--muted">6 roster · 4 en combate</span>
            </div>
          </div>
          {!editingMeta && (
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => setEditingMeta(true)}
            >
              Editar
            </button>
          )}
        </div>

        {editingMeta ? (
          <TeamMetaEditor
            team={team}
            onChange={onUpdateTeamMeta}
            onClose={() => setEditingMeta(false)}
          />
        ) : (
          <>
            {hasMeta ? (
              <div className="team-summary__body">
                {team.description && <p className="team-summary__desc">{team.description}</p>}
                <div className="team-summary__hints">
                  {team.bringHint && (
                    <span className="hint-chip hint-chip--bring">{team.bringHint}</span>
                  )}
                  {team.recruitHint && (
                    <span className="hint-chip hint-chip--recruit">{team.recruitHint}</span>
                  )}
                </div>
                {team.notes && <p className="team-summary__notes">{team.notes}</p>}
              </div>
            ) : (
              <p className="team-summary__empty muted">
                Sin notas.{' '}
                <button type="button" className="link-btn" onClick={() => setEditingMeta(true)}>
                  Añadir descripción
                </button>
              </p>
            )}
          </>
        )}

        <div className="team-summary__legend">
          <span className="role-badge role-nucleo">{ROLE_ES.nucleo}</span>
          <span className="role-badge role-flex">{ROLE_ES.flex}</span>
          <span className="role-badge role-senal">{ROLE_ES.senal}</span>
        </div>
      </section>

      <div className="team-builder__layout">
        <div className="team-slots">
          {team.slots.map((slot, index) => {
            const mon = slot?.pokemonId ? pokemonById[slot.pokemonId] : null
            const isActive = selectedSlotIndex === index && slotModalOpen
            const roleClass = slot?.role ? ROLE_CLASS[slot.role] : ''

            return (
              <button
                key={index}
                type="button"
                className={`team-slot ${isActive ? 'is-active' : ''} ${!mon ? 'is-empty' : ''} ${roleClass}`}
                onClick={() => handleSlotClick(index)}
              >
                <span className="team-slot__num">{index + 1}</span>
                {slot?.role && (
                  <span className={`role-badge ${roleClass}`}>{ROLE_ES[slot.role] || slot.role}</span>
                )}
                {isOwned(slot) && <span className="owned-badge">✓</span>}
                {mon ? (
                  <>
                    <PokemonSprite id={mon.id} name={mon.name} size={72} />
                    <strong>{mon.name}</strong>
                    <div className="type-row">
                      {mon.types.map((t) => (
                        <TypeBadge key={t} type={t} />
                      ))}
                    </div>
                    {slot.roleLabel && <span className="slot-role-label">{slot.roleLabel}</span>}
                    {slot.nature && <span className="slot-meta">{labelNatureEs(slot.nature)}</span>}
                    {slot.ability && <span className="slot-meta">{slot.ability}</span>}
                    {slot.item && <span className="slot-meta">{slot.item}</span>}
                  </>
                ) : (
                  <span className="team-slot__empty">+</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {slotModalOpen && selectedSlotIndex != null && !activeSlot?.pokemonId && (
        <PokemonPickerModal
          pokemonList={pokemonList}
          onPick={handlePickPokemon}
          onClose={closeSlotModal}
        />
      )}

      {slotModalOpen && selectedSlotIndex != null && activePokemon && activeSlot && (
        <PokemonSlotModal
          pokemon={activePokemon}
          slot={activeSlot}
          items={items}
          natures={natures}
          onChange={(next) => onUpdateSlot(selectedSlotIndex, next)}
          onClear={handleClearSlot}
          onClose={closeSlotModal}
        />
      )}
    </div>
  )
}
