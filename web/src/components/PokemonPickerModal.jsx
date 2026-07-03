import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'
import { ModalShell } from './ModalShell'

export function PokemonPickerModal({ pokemonList, onPick, onClose }) {
  const [search, setSearch] = useState('')

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pokemonList
      .filter((p) => {
        if (!q) return true
        return p.name.toLowerCase().includes(q) || p.id.includes(q)
      })
      .slice(0, 48)
  }, [pokemonList, search])

  return (
    <ModalShell className="picker-modal" onClose={onClose} ariaLabelledBy="picker-modal-title">
      <header className="picker-modal__header">
        <h2 id="picker-modal-title">Añadir Pokémon</h2>
        <p className="muted">Busca en el pool M-B y elige uno para este slot.</p>
      </header>
      <input
        type="search"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="picker-search"
        autoFocus
      />
      <div className="picker-grid picker-grid--modal">
        {candidates.map((p) => (
          <button key={p.id} type="button" className="picker-item" onClick={() => onPick(p)}>
            <PokemonSprite id={p.id} name={p.name} size={48} />
            <span>{p.name}</span>
          </button>
        ))}
        {candidates.length === 0 && <p className="muted">Sin resultados</p>}
      </div>
    </ModalShell>
  )
}
