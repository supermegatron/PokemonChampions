import { useMemo, useState } from 'react'
import { TypeBadge } from './TypeBadge'
import { ModalShell } from './ModalShell'
import { labelMoveEs } from '../utils/i18nEs'
import {
  CATEGORY_FILTERS,
  MOVE_TYPES,
  classifyMove,
  filterMoves,
} from '../utils/moveClassifier'
import { MoveDescButton } from './MoveDescButton'

export function MovePickerModal({
  pokemon,
  currentMove,
  slotMoves = [],
  currentSlotIndex = 0,
  onSelect,
  onClose,
}) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [type, setType] = useState('')

  const filtered = useMemo(
    () => filterMoves(pokemon.moves, { search, type, category }),
    [pokemon.moves, search, type, category]
  )

  return (
    <ModalShell className="move-picker-modal" onClose={onClose} ariaLabelledBy="move-picker-title">
      <header className="move-picker__header">
        <h2 id="move-picker-title">Elegir movimiento</h2>
        <p className="muted">{pokemon.name}</p>
      </header>

      <div className="move-picker__filters">
        <input
          type="search"
          className="move-picker__search"
          placeholder="Buscar movimiento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
        <div className="filter-chips">
          {CATEGORY_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={`filter-chip ${category === f.id ? 'is-active' : ''}`}
              onClick={() => setCategory(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="move-picker__types">
          <button
            type="button"
            className={`type-filter ${!type ? 'is-active' : ''}`}
            onClick={() => setType('')}
          >
            Todos los tipos
          </button>
          {MOVE_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`type-filter ${type === t ? 'is-active' : ''}`}
              onClick={() => setType(type === t ? '' : t)}
            >
              <TypeBadge type={t} />
            </button>
          ))}
        </div>
      </div>

      <div className="move-picker__list">
        <button
          type="button"
          className={`move-picker__item ${!currentMove ? 'is-selected' : ''}`}
          onClick={() => onSelect('')}
        >
          <span className="move-picker__name muted">— Vacío —</span>
        </button>
        {filtered.map((move) => {
          const info = classifyMove(move)
          const takenAt = slotMoves.findIndex(
            (m, i) => i !== currentSlotIndex && m === move.name
          )
          const isTaken = takenAt >= 0
          return (
            <div
              key={move.name}
              className={`move-picker__item ${currentMove === move.name ? 'is-selected' : ''}`}
            >
              <button
                type="button"
                className="move-picker__main"
                onClick={() => onSelect(move.name)}
              >
                <div className="move-picker__row">
                  <span className="move-picker__name">{labelMoveEs(move.name)}</span>
                  {info.type ? (
                    <TypeBadge type={info.type} />
                  ) : (
                    <span className="move-picker__no-type muted">Sin tipo</span>
                  )}
                  {isTaken && (
                    <span className="move-picker__taken" title="Intercambiar con ese slot">
                      M{takenAt + 1}
                    </span>
                  )}
                </div>
                <div className="move-picker__meta muted">
                  <span>{info.categoryEs}</span>
                  {move.power != null && <span>Pot. {move.power}</span>}
                  {move.accuracy != null && <span>Prec. {move.accuracy}</span>}
                </div>
              </button>
              <MoveDescButton move={move} />
            </div>
          )
        })}
        {filtered.length === 0 && <p className="muted move-picker__empty">Ningún movimiento coincide.</p>}
      </div>
    </ModalShell>
  )
}
