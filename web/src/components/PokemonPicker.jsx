import { useMemo, useState } from 'react'
import { PokemonSprite } from './PokemonSprite'

export function PokemonPicker({ pokemonList, onPick }) {
  const [search, setSearch] = useState('')

  const candidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    return pokemonList
      .filter((p) => {
        if (!q) return true
        return p.name.toLowerCase().includes(q) || p.id.includes(q)
      })
      .slice(0, 32)
  }, [pokemonList, search])

  return (
    <aside className="editor editor--picker">
      <h3>Añadir Pokémon</h3>
      <p className="muted">Busca en el pool M-B y elige uno para este slot.</p>
      <input
        type="search"
        placeholder="Buscar por nombre…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="picker-search"
      />
      <div className="picker-grid">
        {candidates.map((p) => (
          <button key={p.id} type="button" className="picker-item" onClick={() => onPick(p)}>
            <PokemonSprite id={p.id} name={p.name} size={48} />
            <span>{p.name}</span>
          </button>
        ))}
        {candidates.length === 0 && <p className="muted">Sin resultados</p>}
      </div>
    </aside>
  )
}
