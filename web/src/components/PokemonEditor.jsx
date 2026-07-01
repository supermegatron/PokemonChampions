import { PokemonSprite } from './PokemonSprite'
import { TypeBadge } from './TypeBadge'
import { labelAbilityEs, labelItemEs, labelMoveEs } from '../utils/i18nEs'
import { labelNatureEs, natureHint } from '../utils/natures'

export function PokemonEditor({ pokemon, slot, items, natures, onChange, onClear }) {
  if (!pokemon || !slot) {
    return (
      <aside className="editor editor--empty">
        <p>Selecciona un Pokémon del equipo para ver movimientos, habilidad y objeto.</p>
        <p className="muted">Los nombres en español aparecen junto al inglés del juego.</p>
      </aside>
    )
  }

  const update = (patch) => onChange({ ...slot, ...patch })

  const setMove = (index, value) => {
    const moves = [...slot.moves]
    moves[index] = value
    update({ moves })
  }

  const abilityDesc = pokemon.abilities.find((a) => a.name === slot.ability)?.description
  const legalItems = new Set(items.map((i) => i.name))
  const staleItem = slot.item && !legalItems.has(slot.item) ? slot.item : null

  return (
    <aside className="editor">
      <div className="editor__header">
        <PokemonSprite id={pokemon.id} name={pokemon.name} size={96} />
        <div>
          <h3>{pokemon.name}</h3>
          {slot.roleLabel && <p className="slot-role-label">{slot.roleLabel}</p>}
          <div className="type-row">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>
          <p className="muted stats-line">
            HP {pokemon.stats.hp} · Atk {pokemon.stats.atk} · Def {pokemon.stats.def} ·
            SpA {pokemon.stats.spa} · SpD {pokemon.stats.spd} · Spe {pokemon.stats.spe}
          </p>
        </div>
      </div>

      <label className="field">
        <span>Naturaleza</span>
        <select value={slot.nature || ''} onChange={(e) => update({ nature: e.target.value })}>
          <option value="">{labelNatureEs('')}</option>
          {natures.map((n) => (
            <option key={n.name} value={n.name}>
              {labelNatureEs(n.name)}
            </option>
          ))}
        </select>
        {slot.nature && <small className="field-hint">{natureHint(slot.nature)}</small>}
      </label>

      <label className="field">
        <span>Habilidad</span>
        <select value={slot.ability} onChange={(e) => update({ ability: e.target.value })}>
          {pokemon.abilities.map((a) => (
            <option key={a.name} value={a.name}>
              {labelAbilityEs(a.name)}{a.hidden ? ' (HA)' : ''}
            </option>
          ))}
        </select>
        {abilityDesc && <small className="field-hint">{abilityDesc}</small>}
      </label>

      <label className="field">
        <span>Objeto</span>
        <select value={slot.item} onChange={(e) => update({ item: e.target.value })}>
          <option value="">{labelItemEs('')}</option>
          {staleItem && (
            <option value={staleItem}>
              {labelItemEs(staleItem)} (no legal en M-B)
            </option>
          )}
          {items.map((item) => (
            <option key={item.name} value={item.name}>
              {labelItemEs(item.name)}
            </option>
          ))}
        </select>
      </label>

      <div className="field">
        <span>Movimientos</span>
        {slot.moves.map((move, i) => (
          <select key={i} value={move} onChange={(e) => setMove(i, e.target.value)}>
            <option value="">{labelMoveEs('')}</option>
            {pokemon.moves.map((m) => (
              <option key={m.name} value={m.name}>
                {labelMoveEs(m.name)}{m.power != null ? ` [${m.power}]` : ''}
              </option>
            ))}
          </select>
        ))}
      </div>

      <button type="button" className="btn btn--danger" onClick={onClear}>
        Quitar del equipo
      </button>
    </aside>
  )
}
