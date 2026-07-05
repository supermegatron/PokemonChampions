import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { ModalShell } from './ModalShell'
import { MovePickerModal } from './MovePickerModal'
import { labelAbilityEs, labelItemEs, labelMoveEs } from '../utils/i18nEs'
import { labelNatureEs, NATURE_ES, natureModLabels, natureModsText } from '../utils/natures'
import {
  EV_STAT_MAX,
  EV_TOTAL_MAX,
  STAT_BAR_MAX,
  STAT_META,
  calcEffectiveStats,
  evTotal,
  getNatureMods,
  normalizeEvs,
  setEv,
} from '../utils/statCalc'
import { classifyMove } from '../utils/moveClassifier'
import { MoveDescButton } from './MoveDescButton'

function StatBars({ baseStats, evs, natureName, natureList }) {
  const { values } = calcEffectiveStats(baseStats, evs, natureName, natureList)
  const { plus, minus } = getNatureMods(natureName, natureList)

  return (
    <div className="stat-bars stat-bars--modal">
      {STAT_META.map(({ key, label, color }) => {
        const value = values[key]
        const pct = Math.min(100, Math.round((value / STAT_BAR_MAX[key]) * 100))
        const natureClass =
          key === plus ? 'stat-bar--boost' : key === minus ? 'stat-bar--drop' : ''
        return (
          <div key={key} className={`stat-bar ${natureClass}`}>
            <span className="stat-bar__label">{label}</span>
            <div className="stat-bar__track">
              <div
                className="stat-bar__fill"
                style={{ width: `${pct}%`, background: color }}
              />
            </div>
            <span className="stat-bar__value">{value}</span>
          </div>
        )
      })}
    </div>
  )
}

function EvRow({ statKey, label, value, evs, onChange, color, naturePlus, natureMinus }) {
  const dec = () => onChange(setEv(evs, statKey, value - 1))
  const inc = () => onChange(setEv(evs, statKey, value + 1))
  const natureClass =
    statKey === naturePlus ? 'ev-row--boost' : statKey === natureMinus ? 'ev-row--drop' : ''

  return (
    <div className={`ev-row ${natureClass}`}>
      <span className="ev-row__label" style={{ color }}>
        {label}
      </span>
      <div className="ev-row__controls">
        <button type="button" className="ev-btn" onClick={dec} disabled={value <= 0}>
          −
        </button>
        <input
          type="number"
          min={0}
          max={EV_STAT_MAX}
          value={value}
          onChange={(e) => onChange(setEv(evs, statKey, Number(e.target.value) || 0))}
          className="ev-row__input"
        />
        <button
          type="button"
          className="ev-btn"
          onClick={inc}
          disabled={value >= EV_STAT_MAX || evTotal(evs) >= EV_TOTAL_MAX}
        >
          +
        </button>
      </div>
    </div>
  )
}

export function PokemonSlotModal({ pokemon, slot, items, natures, onChange, onClear, onClose }) {
  const [moveSlot, setMoveSlot] = useState(null)
  const evs = useMemo(() => normalizeEvs(slot.evs), [slot.evs])
  const remaining = EV_TOTAL_MAX - evTotal(evs)
  const { plus: naturePlus, minus: natureMinus } = getNatureMods(slot.nature, natures)

  const update = (patch) => onChange({ ...slot, ...patch })
  const setEvs = (next) => update({ evs: next })

  const legalItems = new Set(items.map((i) => i.name))
  const staleItem = slot.item && !legalItems.has(slot.item) ? slot.item : null
  const abilityDesc = pokemon.abilities.find((a) => a.name === slot.ability)?.description

  const handleMoveSelect = (moveName) => {
    const moves = [...slot.moves]
    const idx = moveSlot
    const otherIdx = moves.findIndex((m, i) => i !== idx && m === moveName)
    if (otherIdx >= 0) {
      const previous = moves[idx]
      moves[idx] = moveName
      moves[otherIdx] = previous
    } else {
      moves[idx] = moveName
    }
    update({ moves })
    setMoveSlot(null)
  }

  return (
    <>
      <ModalShell className="slot-editor-modal" onClose={onClose} ariaLabelledBy="slot-editor-title">
        <header className="slot-editor__header">
          <PokemonSprite id={pokemon.id} name={pokemon.name} size={88} />
          <div>
            <h2 id="slot-editor-title">{pokemon.name}</h2>
            {slot.roleLabel && <p className="slot-role-label">{slot.roleLabel}</p>}
            <div className="type-row">
              {pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} />
              ))}
            </div>
            <p className="muted">Stats en combate (Lv50 del juego + SP · naturaleza)</p>
          </div>
        </header>

        <div className="slot-editor__grid">
          <section className="slot-editor__section">
            <h3>Estadísticas</h3>
            <StatBars
              baseStats={pokemon.stats}
              evs={evs}
              natureName={slot.nature}
              natureList={natures}
            />
          </section>

          <section className="slot-editor__section">
            <div className="slot-editor__section-head">
              <h3>Stat Points</h3>
              <span className={`ev-budget ${remaining === 0 ? 'ev-budget--full' : ''}`}>
                {evTotal(evs)} / {EV_TOTAL_MAX} · quedan {remaining}
              </span>
            </div>
            <p className="muted ev-hint">Máx. {EV_STAT_MAX} por stat (Champions M-B)</p>
            <div className="ev-grid">
              {STAT_META.map(({ key, label, color }) => (
                <EvRow
                  key={key}
                  statKey={key}
                  label={label}
                  value={evs[key]}
                  evs={evs}
                  color={color}
                  naturePlus={naturePlus}
                  natureMinus={natureMinus}
                  onChange={setEvs}
                />
              ))}
            </div>
          </section>

          <section className="slot-editor__section slot-editor__section--wide">
            <h3>Naturaleza</h3>
            <div className="nature-grid">
              {natures.map((n) => {
                const active = slot.nature === n.name
                const es = NATURE_ES[n.name] || n.name
                const mods = natureModLabels(n)
                return (
                  <button
                    key={n.name}
                    type="button"
                    className={`nature-pill ${active ? 'is-active' : ''}`}
                    onClick={() => update({ nature: n.name })}
                  >
                    <span className="nature-pill__en">{n.name}</span>
                    <span className="nature-pill__es">{es}</span>
                    <span className="nature-pill__mods">
                      {!mods ? (
                        <span className="nature-pill__neutral">Neutra</span>
                      ) : (
                        <>
                          <span className="nature-pill__plus">+{mods.plus}</span>
                          <span className="nature-pill__minus">−{mods.minus}</span>
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
            {slot.nature && (
              <p className="muted nature-active-hint">
                {labelNatureEs(slot.nature)}
                {' · '}
                {natureModsText(natures.find((n) => n.name === slot.nature))}
              </p>
            )}
          </section>

          <section className="slot-editor__section">
            <label className="field">
              <span>Habilidad</span>
              <select value={slot.ability} onChange={(e) => update({ ability: e.target.value })}>
                {pokemon.abilities.map((a) => (
                  <option key={a.name} value={a.name}>
                    {labelAbilityEs(a.name)}
                    {a.hidden ? ' (HA)' : ''}
                  </option>
                ))}
              </select>
            </label>
            {abilityDesc && <small className="field-hint">{abilityDesc}</small>}
          </section>

          <section className="slot-editor__section">
            <label className="field">
              <span>Objeto</span>
              <select value={slot.item} onChange={(e) => update({ item: e.target.value })}>
                <option value="">{labelItemEs('')}</option>
                {staleItem && (
                  <option value={staleItem}>{labelItemEs(staleItem)} (no legal en M-B)</option>
                )}
                {items.map((item) => (
                  <option key={item.name} value={item.name}>
                    {labelItemEs(item.name)}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="slot-editor__section slot-editor__section--wide">
            <h3>Movimientos</h3>
            <div className="move-slots">
              {slot.moves.map((move, i) => {
                const moveData = pokemon.moves.find((m) => m.name === move)
                const info = moveData ? classifyMove(moveData) : null
                return (
                  <div key={i} className="move-slot-wrap">
                    <button
                      type="button"
                      className="move-slot-btn"
                      onClick={() => setMoveSlot(i)}
                    >
                      <span className="move-slot-btn__idx">M{i + 1}</span>
                      <span className="move-slot-btn__name">
                        {move ? labelMoveEs(move) : '— Elegir —'}
                      </span>
                      {info?.type && <TypeBadge type={info.type} />}
                      {info && <span className="move-slot-btn__cat muted">{info.categoryEs}</span>}
                    </button>
                    {moveData && <MoveDescButton move={moveData} />}
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        <footer className="slot-editor__footer">
          <button type="button" className="btn btn--danger" onClick={onClear}>
            Quitar del equipo
          </button>
          <button type="button" className="btn btn--accent" onClick={onClose}>
            Listo
          </button>
        </footer>
      </ModalShell>

      {moveSlot != null && (
        <MovePickerModal
          pokemon={pokemon}
          currentMove={slot.moves[moveSlot]}
          slotMoves={slot.moves}
          currentSlotIndex={moveSlot}
          onSelect={handleMoveSelect}
          onClose={() => setMoveSlot(null)}
        />
      )}
    </>
  )
}
